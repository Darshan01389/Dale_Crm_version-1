import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, status, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.voice_recording import VoiceRecording
from app.services.voice_service import voice_service
from app.services.storage_service import storage_service
from app.core.dependencies import get_current_user, check_ai_quota
from app.core.limiter import limiter
from app.models.user import User
from app.models.activity import Activity
from app.models.lead import Lead
from datetime import datetime
from app.services.webrtc_service import webrtc_manager, handle_webrtc_message

router = APIRouter(prefix="/voice", tags=["Voice AI"])

@router.websocket("/ws")
async def websocket_webrtc_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for WebRTC signaling (Self-Hosted Softphone)"""
    await webrtc_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await handle_webrtc_message(user_id, data)
    except WebSocketDisconnect:
        webrtc_manager.disconnect(user_id)


@router.get("")
def list_voice_recordings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists voice recordings for the current user.
    """
    return db.query(VoiceRecording).filter(VoiceRecording.owner_id == current_user.id).order_by(VoiceRecording.occurred_at.desc()).all()

@router.get("/{recording_id}/stream")
def stream_voice_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streams the voice recording file. Supports local paths and cloud URLs.
    """
    recording = db.query(VoiceRecording).filter(
        VoiceRecording.id == recording_id,
        VoiceRecording.owner_id == current_user.id
    ).first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
        
    if recording.file_path.startswith(("http://", "https://")):
        return RedirectResponse(recording.file_path)
        
    if not os.path.exists(recording.file_path):
        raise HTTPException(status_code=404, detail="Recording file not found locally")
        
    return FileResponse(recording.file_path)

@router.post("/upload")
@limiter.limit("10/minute")
async def upload_voice_recording(
    request: Request,
    file: UploadFile = File(...),
    lead_id: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _quota: None = Depends(check_ai_quota)
):
    """
    Uploads a voice recording (max 50MB), transcribes it, and performs AI analysis.
    """
    if not file.filename.endswith((".mp3", ".wav", ".m4a", ".ogg", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    # Read and verify file size limit (max 50MB)
    file_bytes = await file.read()
    max_size = 50 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large. Maximum size allowed is 50MB."
        )

    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"

    # Save file using Storage Service (local or cloud)
    try:
        file_path = storage_service.save_file(file_bytes, filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 1. Transcribe
    transcript = await voice_service.transcribe_audio(file_path)
    
    # 2. Analyze Intelligence
    analysis = {}
    if transcript:
        analysis = await voice_service.analyze_intelligence(transcript)

    # 3. Save to DB
    recording = VoiceRecording(
        id=file_id,
        owner_id=current_user.id,
        lead_id=lead_id,
        filename=file.filename,
        file_path=file_path,
        transcript=transcript,
        sentiment_label=analysis.get("sentiment"),
        tone_analysis=analysis.get("tone"),
        buying_signals=str(analysis.get("signals")),
        summary=analysis.get("summary")
    )
    
    db.add(recording)
    
    # 4. Create Activity
    if lead_id:
        activity = Activity(
            lead_id=lead_id,
            owner_id=current_user.id,
            activity_type="voice",
            subject="Call Recording Logged",
            body=file_id,
            occurred_at=datetime.utcnow()
        )
        db.add(activity)
        
        # 5. Confidence-Gated, Evidence-Grounded Decision Layer
        # Replaces unsafe direct write (lines 137-144) per IEEE Research Specification
        from app.services.decision_gate import decision_gate_service
        gate_result = decision_gate_service.evaluate_and_execute(
            db=db,
            lead_id=lead_id,
            voice_recording_id=recording.id,
            transcript=transcript,
            analysis=analysis,
            audio_file_path=file_path,
        )

    db.commit()
    db.refresh(recording)

    return {
        "id": str(recording.id),
        "transcript": transcript,
        "analysis": analysis,
        "gate_decision": gate_result.get("primary_decision") if lead_id else None,
        "all_candidates": gate_result.get("all_candidates", []) if lead_id else [],
        "acoustic_metrics": gate_result.get("acoustic_metrics", {}) if lead_id else {},
    }

@router.delete("/{recording_id}", status_code=204)
def delete_voice_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a voice recording and removes its file from storage.
    """
    recording = db.query(VoiceRecording).filter(VoiceRecording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
        
    # Check authorization (only owner or admin can delete)
    if recording.owner_id != current_user.id and not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this recording")
        
    # Remove file from storage
    storage_service.delete_file(recording.file_path)
    
    # Delete database record
    db.delete(recording)
    db.commit()

@router.get("/{recording_id}/delete")
def delete_voice_recording_get(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET fallback endpoint to delete a voice recording.
    """
    delete_voice_recording(recording_id, db, current_user)
    return {"status": "success", "message": "Recording deleted successfully."}


from pydantic import BaseModel

class ObjectionDetectRequest(BaseModel):
    text: str
    prospect_name: str | None = "Prospect"

@router.post("/detect-objection")
def detect_objection(
    body: ObjectionDetectRequest,
    current_user: User = Depends(get_current_user)
):
    """Real-time objection detection and winning battlecard generator for live calls."""
    text_lower = body.text.lower()
    cards = []

    # 1. Price / Budget
    if any(k in text_lower for k in ["expensive", "cost", "budget", "price", "pricing", "discount", "cheaper", "money"]):
        cards.append({
            "type": "PRICING_OBJECTION",
            "title": "Pricing & Budget Concern",
            "icon": "💰",
            "color": "#F59E0B",
            "confidence": 94,
            "strategy": "Pivot to Total Cost of Ownership (TCO) & eliminate hidden API fees.",
            "script": "I completely understand budget is top of mind. Most CRM vendors charge separately for WhatsApp API gateways, telephone add-ons, and AI assistants. Dale CRM bundles all three natively, reducing total stack cost by ~35%. Would a quick 3-month ROI comparison help?"
        })

    # 2. Competitor Mention
    if any(k in text_lower for k in ["hubspot", "salesforce", "zoho", "freshsales", "competitor", "other vendor"]):
        cards.append({
            "type": "COMPETITOR_MENTION",
            "title": "Competitor Differentiation",
            "icon": "⚔️",
            "color": "#EC4899",
            "confidence": 91,
            "strategy": "Highlight native omnichannel and zero setup time vs expensive consultants.",
            "script": "They are a reputable tool! Where our users see the biggest difference is implementation time and live collaboration: with Dale CRM, you have built-in WebRTC softphones, WhatsApp automation, and live battlecards without paying $15,000 in integration fees."
        })

    # 3. Timing / Delays
    if any(k in text_lower for k in ["later", "next quarter", "busy", "send email", "not now", "next month"]):
        cards.append({
            "type": "TIMING_OBJECTION",
            "title": "Timing & Urgency Rebuttal",
            "icon": "⏳",
            "color": "#6366F1",
            "confidence": 88,
            "strategy": "Offer a zero-friction micro-commitment or self-service sandbox.",
            "script": "I completely respect that timing is tight right now. How about I set you up with an interactive demo sandbox so you can test it on your own schedule, and we touch base for just 5 minutes next Tuesday?"
        })

    # 4. Authority / Multi-stakeholder
    if any(k in text_lower for k in ["boss", "manager", "board", "partner", "decision maker", "team"]):
        cards.append({
            "type": "AUTHORITY_GAP",
            "title": "Decision Maker Enablement",
            "icon": "👔",
            "color": "#8B5CF6",
            "confidence": 85,
            "strategy": "Arm the prospect with executive ROI materials to champion Dale CRM internally.",
            "script": "Understood! To make your internal sync painless, I can share an executive 1-page business case outlining pipeline velocity and compliance. Would that save you time when presenting to your leadership?"
        })

    if not cards:
        cards.append({
            "type": "DISCOVERY_INSIGHT",
            "title": "Discovery & Value Anchor",
            "icon": "💡",
            "color": "#10B981",
            "confidence": 80,
            "strategy": "Dig deeper into their sales team bottlenecks.",
            "script": "That's very helpful context. Out of curiosity, what is currently your biggest bottleneck—lead response time or pipeline follow-ups?"
        })

    return {
        "text_analyzed": body.text,
        "battlecards": cards,
        "recommended_tone": "Empathetic & Consultative",
        "talk_to_listen_ratio_target": "40% Talk / 60% Listen"
    }

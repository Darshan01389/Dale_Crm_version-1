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
        
        # 5. Pipeline Auto-Update
        if analysis and analysis.get("suggested_stage"):
            suggested = analysis.get("suggested_stage").lower()
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead and suggested in ["contacted", "proposal", "negotiation", "won", "lost"]:
                lead.status = suggested
                db.add(lead)

    db.commit()
    db.refresh(recording)

    return {
        "id": recording.id,
        "transcript": transcript,
        "analysis": analysis
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

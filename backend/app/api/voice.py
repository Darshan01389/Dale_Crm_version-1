import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.voice_recording import VoiceRecording
from app.services.voice_service import voice_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/voice", tags=["Voice AI"])

UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    Streams the voice recording file.
    """
    recording = db.query(VoiceRecording).filter(
        VoiceRecording.id == recording_id,
        VoiceRecording.owner_id == current_user.id
    ).first()
    
    if not recording or not os.path.exists(recording.file_path):
        raise HTTPException(status_code=404, detail="Recording not found")
        
    return FileResponse(recording.file_path)

@router.post("/upload")
async def upload_voice_recording(
    file: UploadFile = File(...),
    lead_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a voice recording, transcribes it with Whisper, and performs AI analysis.
    """
    if not file.filename.endswith((".mp3", ".wav", ".m4a", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

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
    db.commit()
    db.refresh(recording)

    return {
        "id": recording.id,
        "transcript": transcript,
        "analysis": analysis
    }

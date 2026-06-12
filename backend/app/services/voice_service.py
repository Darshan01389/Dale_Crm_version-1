import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.ollama_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions" if settings.USE_OLLAMA_FOR_ALL else None
        
    async def transcribe_audio(self, file_path: str) -> Optional[str]:
        """
        Uses faster-whisper for local transcription.
        """
        if not os.path.exists(file_path):
            print(f"Voice AI: File not found for transcription: {file_path}")
            return None
            
        try:
            from faster_whisper import WhisperModel
            # Load the whisper model. 'base.en' is fast and good enough for most sales calls.
            # You could move model initialization to the class __init__ to avoid loading it per request.
            model = WhisperModel("base.en", device="cpu", compute_type="int8")
            print(f"Voice AI: Transcribing {file_path} locally...")
            segments, info = model.transcribe(file_path, beam_size=5)
            
            transcript_text = ""
            for segment in segments:
                transcript_text += segment.text + " "
                
            print("Voice AI: Transcription complete.")
            return transcript_text.strip()
        except Exception as e:
            print(f"Voice AI: Transcription failed: {e}")
            return None

    async def analyze_intelligence(self, text: str) -> Dict[str, Any]:
        """
        Uses LLM to extract insights: sentiment, tone, buying signals.
        """
        if not self.ollama_url or not text:
            return {}

        try:
            prompt = f"""
            Analyze the following sales call transcript and extract advanced conversational intelligence.
            Respond strictly in JSON format with the following keys:
            1. "sentiment" (String: Positive/Neutral/Negative)
            2. "tone" (String: e.g., Interested, Hesitant, Aggressive)
            3. "signals" (Array of Strings: Specific buying signals)
            4. "summary" (String: Brief summary of the call, max 2 sentences)
            5. "suggested_stage" (String: ONE of ["new", "contacted", "proposal", "negotiation", "won", "lost"])
            6. "objections" (Array of Strings: Any objections raised by the prospect, e.g. "Price is too high")
            7. "competitors_mentioned" (Array of Strings: Any competing products or companies mentioned)
            8. "action_items" (Array of Strings: Specific next steps or promises made by either party)
            9. "bant_qualification" (Object with boolean keys: "budget_identified", "authority_confirmed", "need_established", "timeline_clear")

            Transcript:
            {text}
            """
            
            body = {
                "model": settings.VOICE_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "You are an elite conversational intelligence analyzer (like Gong or Chorus)."},
                    {"role": "user", "content": prompt}
                ]
            }
            
            headers = {
                "Content-Type": "application/json",
            }
            if settings.NVIDIA_API_KEY:
                headers["Authorization"] = f"Bearer {settings.NVIDIA_API_KEY}"

            req = urllib.request.Request(
                self.ollama_url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            
            with urllib.request.urlopen(req, timeout=45) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            
            content = payload["choices"][0]["message"]["content"]
            
            return json.loads(content)
        except Exception as e:
            print(f"Voice AI: Error during intelligence analysis: {e}")
            return {}

voice_service = VoiceService()

def trigger_background_transcription(db, recording_id, file_path):
    """
    Spawns a background thread/task to transcribe the audio and analyze it.
    """
    import threading
    from app.core.database import SessionLocal
    from app.models.voice_recording import VoiceRecording
    from app.models.activity import Activity
    import asyncio
    from datetime import datetime
    
    def _run_transcription():
        local_db = SessionLocal()
        try:
            recording = local_db.query(VoiceRecording).filter(VoiceRecording.id == recording_id).first()
            if not recording:
                return
                
            # Create a new event loop for this thread if using async transcribe
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # 1. Transcribe
            transcript = loop.run_until_complete(voice_service.transcribe_audio(file_path))
            recording.ai_transcript = transcript
            
            # 2. Analyze
            analysis = {}
            if transcript:
                analysis = loop.run_until_complete(voice_service.analyze_intelligence(transcript))
                
            recording.sentiment_label = analysis.get("sentiment")
            recording.tone_analysis = analysis.get("tone")
            recording.buying_signals = str(analysis.get("signals")) if analysis.get("signals") else None
            recording.summary = analysis.get("summary")
            
            # Store advanced metrics in extra_metadata or mapped fields
            # For simplicity, we'll map them onto the activity record
            
            local_db.add(recording)
            
            # 3. Create Activity
            activity = Activity(
                lead_id=recording.lead_id,
                owner_id=recording.owner_id,
                activity_type="voice_call",
                subject="Local Voice Call Logged",
                body=recording.summary or "Call completed.",
                occurred_at=datetime.utcnow(),
                extra_metadata=json.dumps({
                    "recording_id": str(recording.id),
                    "transcript_preview": transcript[:200] + "..." if transcript and len(transcript) > 200 else transcript,
                    "objections": analysis.get("objections", []),
                    "competitors_mentioned": analysis.get("competitors_mentioned", []),
                    "action_items": analysis.get("action_items", []),
                    "bant_qualification": analysis.get("bant_qualification", {})
                })
            )
            local_db.add(activity)
            
            # Force timeline update
            local_db.commit()
            
            from app.services.lead_service import refresh_lead_analysis
            from app.models.lead import Lead
            lead = local_db.query(Lead).filter(Lead.id == recording.lead_id).first()
            if lead:
                refresh_lead_analysis(local_db, lead)
                
            print(f"Background transcription complete for recording {recording_id}")
            
        except Exception as e:
            print(f"Background transcription error: {e}")
        finally:
            local_db.close()

    thread = threading.Thread(target=_run_transcription)
    thread.start()

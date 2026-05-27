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
        Uses OpenAI Whisper to transcribe audio files. (Disabled for Ollama)
        """
        print("Voice AI: Transcription requires OpenAI/Whisper. Skipping transcription.")
        return "Transcription skipped (Using Ollama locally)"

    async def analyze_intelligence(self, text: str) -> Dict[str, Any]:
        """
        Uses LLM to extract insights: sentiment, tone, buying signals.
        """
        if not self.ollama_url or not text:
            return {}

        try:
            prompt = f"""
            Analyze the following sales call transcript and extract intelligence:
            1. Sentiment (Positive/Neutral/Negative)
            2. Tone (e.g., Interested, Hesitant, Aggressive)
            3. Buying Signals (List any specific signals)
            4. Brief Summary (max 2 sentences)
            5. Suggested Pipeline Stage: based on context, pick ONE of ["new", "contacted", "proposal", "negotiation", "won", "lost"]. If they want a price breakdown or proposal sent, choose "proposal". If they are discussing discounts, choose "negotiation". If they agreed to buy, "won". Otherwise default to "contacted" or "new".

            Transcript:
            {text}

            Respond in JSON format with keys: sentiment, tone, signals, summary, suggested_stage.
            """
            
            body = {
                "model": settings.CHAT_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "You are a sales intelligence analyzer."},
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

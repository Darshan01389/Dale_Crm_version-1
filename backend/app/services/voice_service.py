import os
from typing import Optional, Dict, Any
import openai
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = openai.OpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def transcribe_audio(self, file_path: str) -> Optional[str]:
        """
        Uses OpenAI Whisper to transcribe audio files.
        """
        if not self.client:
            print("Voice AI: OpenAI client not configured. Skipping transcription.")
            return "Transcription skipped (No API Key)"

        try:
            with open(file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file,
                    response_format="text"
                )
                return transcript
        except Exception as e:
            print(f"Voice AI: Error during transcription: {e}")
            return None

    async def analyze_intelligence(self, text: str) -> Dict[str, Any]:
        """
        Uses GPT-4 to extract insights: sentiment, tone, buying signals.
        """
        if not self.client or not text:
            return {}

        try:
            prompt = f"""
            Analyze the following sales call transcript and extract intelligence:
            1. Sentiment (Positive/Neutral/Negative)
            2. Tone (e.g., Interested, Hesitant, Aggressive)
            3. Buying Signals (List any specific signals)
            4. Brief Summary (max 2 sentences)

            Transcript:
            {text}

            Respond in JSON format with keys: sentiment, tone, signals, summary.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "system", "content": "You are a sales intelligence analyzer."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Voice AI: Error during intelligence analysis: {e}")
            return {}

voice_service = VoiceService()

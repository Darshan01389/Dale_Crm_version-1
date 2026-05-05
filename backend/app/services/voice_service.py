import os
from typing import Optional, Dict, Any
import openai
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        
        if self.openai_key:
            self.openai_client = openai.OpenAI(api_key=self.openai_key)
        else:
            self.openai_client = None
            
        if self.groq_key:
            from groq import Groq
            self.groq_client = Groq(api_key=self.groq_key)
        else:
            self.groq_client = None

    async def transcribe_audio(self, file_path: str) -> Optional[str]:
        """
        Uses OpenAI Whisper to transcribe audio files.
        """
        if not self.openai_client:
            print("Voice AI: OpenAI client not configured. Skipping transcription.")
            return "Transcription skipped (No API Key)"

        try:
            with open(file_path, "rb") as audio_file:
                transcript = self.openai_client.audio.transcriptions.create(
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
        Uses LLM to extract insights: sentiment, tone, buying signals.
        """
        is_groq = settings.USE_GROQ_FOR_ALL and self.groq_client
        client = self.groq_client if is_groq else self.openai_client
        
        if not client or not text:
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
            
            model = settings.GROQ_MODEL if is_groq else "gpt-4-turbo-preview"
            
            if is_groq:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "system", "content": "You are a sales intelligence analyzer."},
                              {"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
            else:
                response = client.chat.completions.create(
                    model=model,
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

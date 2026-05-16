import os
import json
import urllib.request
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables from parent directory .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class DaleIQChatbot:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "https://integrate.api.nvidia.com")
        self.model = os.getenv("OLLAMA_MODEL", "meta/llama-3.1-70b-instruct")
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.system_prompt = (
            "You are the DaleIQ Executive Assistant—a world-class sales strategist and product expert.\n"
            "Your mission is to empower salespersons with both platform knowledge and high-level business intelligence.\n\n"
            "--- AREA 1: DALEIQ PLATFORM EXPERTISE ---\n"
            "- Explain features like Global Inbox, Call Coach (AI signals), Revenue Forecast (confidence bands), and Rep Pulse.\n"
            "- Help users navigate the 34 screens of the CRM (e.g., Lead Details, Today's Tasks, Org Setup).\n\n"
            "--- AREA 2: SALES STRATEGY & ADVICE ---\n"
            "- Provide tactics for cold calling, social selling, and email outreach.\n"
            "- Offer frameworks for objection handling (e.g., LAER, BANT, SPIN selling).\n"
            "- Suggest ways to accelerate pipeline velocity and improve win rates.\n\n"
            "--- AREA 3: BUSINESS & MARKET TRENDS ---\n"
            "- Discuss modern B2B/B2C sales trends (AI in sales, consultative selling, remote closing).\n"
            "- Help with industrial terminology, KPI definitions (ACV, LTV, CAC, Churn), and market analysis.\n"
            "- Act as a mentor for career growth and professional sales development.\n\n"
            "GUIDELINES:\n"
            "1. Be professional, data-driven, and highly encouraging.\n"
            "2. If a query is about the app, be specific about the feature.\n"
            "3. If a query is about business/sales, provide actionable strategies.\n"
            "4. Keep responses structured (use bullet points where appropriate)."
        )

    def get_response(self, message: str, history: List[Dict[str, str]] = None) -> str:
        if history is None:
            history = []
            
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # Add history
        for msg in history:
            messages.append(msg)
            
        # Add new message
        messages.append({"role": "user", "content": message})
        
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        url = f"{self.base_url.rstrip('/')}/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"Error: I'm having trouble connecting to my brain right now. ({str(e)})"

if __name__ == "__main__":
    # Quick test
    bot = DaleIQChatbot()
    print(f"DaleIQ Bot: Hello! How can I help you today? (Model: {bot.model})")
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            print(f"DaleIQ Bot: {bot.get_response(user_input)}")
        except EOFError:
            break

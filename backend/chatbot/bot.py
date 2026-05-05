import os
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from parent directory .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class DaleIQChatbot:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
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

    def get_response(self, message: str, history: List[Dict[str, str]] = []) -> str:
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # Add history
        for msg in history:
            messages.append(msg)
            
        # Add new message
        messages.append({"role": "user", "content": message})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: I'm having trouble connecting to my brain right now. ({str(e)})"

if __name__ == "__main__":
    # Quick test
    bot = DaleIQChatbot()
    print("DaleIQ Bot: Hello! How can I help you today?")
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            print(f"DaleIQ Bot: {bot.get_response(user_input)}")
        except EOFError:
            break

import sys
import os

sys.path.insert(0, os.path.abspath("."))

from app.schemas.lead import LeadCreate, LeadIngest
from app.ml.sentiment_service import SentimentResult
from app.services.openai_message_service import generate_whatsapp_message, generate_ai_summary, ai_suggest_reply
from app.services.lead_gathering_service import extract_lead_from_raw_text
from app.services.ai_scoring_service import score_new_lead

def run_tests():
    print("Testing AI Services...")
    
    # 1. Lead Gathering Service
    print("\n--- Testing Lead Gathering ---")
    try:
        ingest = LeadIngest(
            raw_text="Hi, I'm John Doe from TechCorp. My email is john@techcorp.com. I'm interested in your CRM.",
            source_platform="website",
            source_type="form"
        )
        lead = extract_lead_from_raw_text(ingest)
        print("Success! Extracted Lead:", lead.model_dump() if hasattr(lead, 'model_dump') else lead.dict())
    except Exception as e:
        print("Failed Lead Gathering:", e)

    # 2. AI Scoring Service
    print("\n--- Testing AI Scoring ---")
    try:
        lead_create = LeadCreate(
            title="John Doe",
            company="TechCorp",
            email="john@techcorp.com",
            phone="1234567890",
            status="new",
            source="website",
            notes="Interested in CRM"
        )
        score, summary = score_new_lead(lead_create)
        print(f"Success! Score: {score}, Summary: {summary}")
    except Exception as e:
        print("Failed AI Scoring:", e)

    # 3. OpenAI Message Service (generate_whatsapp_message)
    print("\n--- Testing WhatsApp Message Generation ---")
    try:
        sentiment = SentimentResult(label="positive", compound=0.8)
        msg = generate_whatsapp_message(lead_create, sentiment)
        print("Success! Generated Message:\n", msg)
    except Exception as e:
        print("Failed Message Generation:", e)

    # 4. OpenAI Message Service (generate_ai_summary)
    print("\n--- Testing AI Summary ---")
    class MockActivity:
        def __init__(self, t, s, b):
            self.activity_type = t
            self.subject = s
            self.body = b
            self.occurred_at = "2023-01-01"
            
    class MockCall:
        def __init__(self, s, sl):
            self.summary = s
            self.occurred_at = "2023-01-01"
            self.sentiment_label = sl
            
    acts = [MockActivity("email", "Follow up", "Just checking in")]
    calls = [MockCall("Good call, prospect is interested", "positive")]
    try:
        summary = generate_ai_summary(lead_create, acts, calls)
        print("Success! AI Summary:\n", summary)
    except Exception as e:
        print("Failed AI Summary:", e)

    # 5. OpenAI Message Service (ai_suggest_reply)
    print("\n--- Testing AI Suggested Reply ---")
    try:
        reply = ai_suggest_reply(lead_create, acts, calls)
        print("Success! AI Suggested Reply:\n", reply)
    except Exception as e:
        print("Failed AI Suggested Reply:", e)


if __name__ == "__main__":
    run_tests()

from sqlalchemy.orm import Session
from uuid import UUID
import json
import logging

from app.models.campaign import Campaign
from app.models.campaign_metric import CampaignMetric
from app.models.ai_recommendation import AIRecommendation
from app.services.openai_message_service import _llm_request
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_campaign_insights(db: Session, force_refresh: bool = False):
    """
    Analyzes active campaigns and generates AI recommendations using LLM.
    """
    campaigns = db.query(Campaign).filter(Campaign.status == 'Active').all()
    if not campaigns:
        return []

    insights_generated = []

    for campaign in campaigns:
        # Get recent metrics
        metrics = db.query(CampaignMetric).filter(CampaignMetric.campaign_id == campaign.id).order_by(CampaignMetric.date.desc()).limit(7).all()
        
        # Build prompt payload
        metrics_data = []
        total_spend = 0
        total_leads = 0
        for m in metrics:
            total_spend += m.spend
            total_leads += m.leads_generated
            metrics_data.append({
                "date": str(m.date),
                "spend": m.spend,
                "leads": m.leads_generated,
                "cpl": round(m.spend / m.leads_generated, 2) if m.leads_generated > 0 else 0
            })

        avg_cpl = round(total_spend / total_leads, 2) if total_leads > 0 else 0

        prompt = f"""
        You are an expert AI Marketing Analyst for a CRM. Analyze the following 7-day performance for campaign '{campaign.name}' (Budget: ${campaign.budget}):
        
        Metrics:
        {json.dumps(metrics_data, indent=2)}
        
        Overall Spend: ${total_spend}
        Total Leads: {total_leads}
        Avg CPL: ${avg_cpl}
        
        Based on these metrics, provide ONE critical recommendation.
        Respond in strict JSON format:
        {{
            "insight_type": "SCALE" | "PAUSE" | "AUDIENCE_INSIGHT",
            "message": "A short 2-sentence actionable recommendation."
        }}
        """

        try:
            # Query LLM (using ANALYTICS_MODEL)
            body = {
                "model": settings.ANALYTICS_MODEL,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": "You are a JSON-only API. Output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ]
            }
            response_text = _llm_request(body)
            
            # Clean response
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            insight = json.loads(response_text)

            if insight and "insight_type" in insight and "message" in insight:
                # Save recommendation
                rec = AIRecommendation(
                    campaign_id=campaign.id,
                    insight_type=insight["insight_type"],
                    message=insight["message"]
                )
                db.add(rec)
                db.commit()
                db.refresh(rec)
                insights_generated.append(rec)

        except Exception as e:
            logger.error(f"Failed to generate AI insight for campaign {campaign.id}: {str(e)}")

    return insights_generated

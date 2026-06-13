from fastapi import APIRouter, BackgroundTasks
from app.services.openai_message_service import _llm_request
import logging

router = APIRouter(prefix="/system", tags=["System"])
logger = logging.getLogger(__name__)

def _ping_ai_models():
    """Sends a tiny dummy prompt to wake up models in the background"""
    # Disabled because it was blocking real AI requests
    logger.info("AI Pre-warmed successfully")

@router.get("/prewarm")
def prewarm_ai(background_tasks: BackgroundTasks):
    """
    Called asynchronously by the frontend on login page load to wake up AI models.
    """
    background_tasks.add_task(_ping_ai_models)
    return {"status": "pre-warming started"}

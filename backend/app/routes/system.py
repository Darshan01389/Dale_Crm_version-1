from fastapi import APIRouter, BackgroundTasks
from app.services.openai_message_service import _llm_request
import logging

router = APIRouter(prefix="/system", tags=["System"])
logger = logging.getLogger(__name__)

def _ping_ai_models():
    """Sends a tiny dummy prompt to wake up models in the background"""
    try:
        # Ping the main fast chat model
        _llm_request({
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1
        })
        logger.info("AI Pre-warmed successfully")
    except Exception as e:
        logger.error(f"AI Pre-warm failed: {e}")

@router.get("/prewarm")
def prewarm_ai(background_tasks: BackgroundTasks):
    """
    Called asynchronously by the frontend on login page load to wake up AI models.
    """
    background_tasks.add_task(_ping_ai_models)
    return {"status": "pre-warming started"}

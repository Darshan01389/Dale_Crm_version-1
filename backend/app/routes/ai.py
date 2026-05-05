from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.openai_message_service import _openai_request
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]

@router.post("/chat")
async def chat_with_assistant(request: ChatRequest):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OpenAI API key not configured")

    system_prompt = (
        "You are the DaleIQ AI Assistant. You help users manage their CRM, leads, and sales pipelines. "
        "You have deep knowledge of the project's features: Global Inbox, Team Pulse, Kanban Pipeline, Call Coach, and Forecast. "
        "Your goal is to help users automate their work and provide insights. "
        "Keep your answers concise, professional, and helpful."
    )

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    for msg in request.history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add current message
    messages.append({"role": "user", "content": request.message})

    body = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0.7,
        "messages": messages,
    }

    try:
        reply = _openai_request(body)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

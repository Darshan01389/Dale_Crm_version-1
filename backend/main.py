# main.py (final version for Week 2)
import sys
import os
# Make whatsapp_agent importable from the backend root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine
# from app.routes import analytics, auth, company, salesperson, activities, deals, leads, pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.jobs.scheduler import shutdown_scheduler, start_scheduler
    from app.ml.predictor import warm_ml_models

    warm_ml_models()
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()


app = FastAPI(
    title="DeaL CRM API",
    description="AI-Powered Sales Pipeline CRM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure tables exist
from app.core.database import Base, engine
from app.models import (
    user as m_user, team as m_team, company as m_company, 
    lead as m_lead, deal as m_deal, activity as m_activity, 
    pipeline_stage as m_stage, voice_recording as m_voice
)
Base.metadata.create_all(bind=engine)

from app.routes.auth import router as auth_router
from app.routes.leads import router as lead_router
from app.api.voice import router as voice_router
from app.routes.ai import router as ai_router
from app.routes.teams import router as team_router
from app.routes.analytics import router as analytics_router
from app.routes.company import router as company_router
from app.routes.salesperson import router as salesperson_router
from app.routes.activities import router as activity_router
from app.routes.deals import router as deal_router
from app.routes.pipeline import router as pipeline_router
from app.routes.users import router as user_router
from app.routes.chatbot import router as chatbot_router
from app.routes.whatsapp import router as whatsapp_router
from app.routes.tasks import router as task_router

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(lead_router)
app.include_router(voice_router)
app.include_router(company_router)
app.include_router(salesperson_router)
app.include_router(deal_router)
app.include_router(activity_router)
app.include_router(pipeline_router)
app.include_router(analytics_router)
app.include_router(team_router)
app.include_router(ai_router)
app.include_router(chatbot_router)   # Merged chatbot — no separate server needed
app.include_router(whatsapp_router)  # WhatsApp Agent + Simulator
app.include_router(task_router)      # AI Tasks & Stagnation

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    from fastapi.responses import JSONResponse
    print(f"ERROR: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

@app.get("/")
def root():
    return {"message": "DeaL CRM API is running ✅"}

@app.get("/health")
def health_check():
    from app.ml.predictor import ml_status

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected ✅"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "healthy", "database": db_status, "ml": ml_status()}
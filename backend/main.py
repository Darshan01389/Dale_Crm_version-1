# main.py (final version for Week 2)
import sys
import os
# Make whatsapp_agent importable from the backend root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine
from app.core.config import settings

# ── LOGGING CONFIGURATION ─────────────────────────────────────────
from loguru import logger
os.makedirs("logs", exist_ok=True)
logger.add("logs/app.log", rotation="10 MB", retention="7 days", level="INFO")
logger.info("Initializing DeaL CRM Application...")

# ── SENTRY ERROR MONITORING ──────────────────────────────────────
if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )
    logger.info("Sentry integration initialized.")

# ── RATE LIMITING CONFIGURATION ──────────────────────────────────
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


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

# Wire Rate Limiter to application state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure tables exist
from app.core.database import Base, engine
from app.models import (
    user as m_user, team as m_team, company as m_company, 
    lead as m_lead, deal as m_deal, activity as m_activity, 
    pipeline_stage as m_stage, voice_recording as m_voice,
    forum_post as m_forum_post, lead_source as m_lead_source,
    webhook_log as m_webhook_log, campaign as m_campaign,
    utm_tracking as m_utm, website_event as m_event,
    campaign_metric as m_metric, automation_rule as m_automation,
    billing as m_billing, password_reset as m_reset,
    forum_reply as m_forum_reply, calendar_event as m_calendar,
    research_extension as m_research
)
Base.metadata.create_all(bind=engine)

# Raw SQL migration to add join_code columns in PostgreSQL
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS join_code VARCHAR(10)"))
    except Exception as e:
        print(f"Migration error for companies join_code: {e}")
    try:
        conn.execute(text("ALTER TABLE teams ADD COLUMN IF NOT EXISTS join_code VARCHAR(10)"))
    except Exception as e:
        print(f"Migration error for teams join_code: {e}")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)"))
    except Exception as e:
        print(f"Migration error for users company_id: {e}")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_banned BOOLEAN DEFAULT FALSE"))
    except Exception as e:
        print(f"Migration error for users company_banned: {e}")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_team_ids VARCHAR DEFAULT ''"))
    except Exception as e:
        print(f"Migration error for users banned_team_ids: {e}")

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
from app.routes.forum import router as forum_router
from app.routes.lead_sources import router as lead_source_router
from app.routes.webhooks import router as webhook_router
from app.routes.events import router as event_router
from app.routes.automation import router as automation_router
from app.routes.billing import router as billing_router
from app.routes.system import router as system_router
from app.routes.calendar import router as calendar_router
from app.routes.superadmin import router as superadmin_router
from app.routes.research_audit import router as research_audit_router
from app.routes.dalelq_routes import router as dalelq_router

ALL_ROUTERS = [
    auth_router, superadmin_router, user_router, lead_router, voice_router,
    company_router, salesperson_router, deal_router, activity_router,
    pipeline_router, analytics_router, team_router, ai_router, chatbot_router,
    whatsapp_router, task_router, forum_router, lead_source_router,
    webhook_router, event_router, automation_router, billing_router,
    system_router, calendar_router, research_audit_router, dalelq_router
]

for r in ALL_ROUTERS:
    app.include_router(r)
    app.include_router(r, prefix="/api")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    from fastapi.responses import JSONResponse
    print(f"ERROR: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

# ── REAL-TIME PRESENCE & COLLABORATION WEBSOCKETS ─────────────
class PresenceManager:
    def __init__(self):
        # lead_id -> {websocket: user_dict}
        self.rooms: dict[str, dict[WebSocket, dict]] = {}

    async def connect(self, lead_id: str, websocket: WebSocket, user_info: dict):
        await websocket.accept()
        if lead_id not in self.rooms:
            self.rooms[lead_id] = {}
        self.rooms[lead_id][websocket] = user_info
        await self.broadcast(lead_id)

    async def disconnect(self, lead_id: str, websocket: WebSocket):
        if lead_id in self.rooms and websocket in self.rooms[lead_id]:
            del self.rooms[lead_id][websocket]
            if not self.rooms[lead_id]:
                del self.rooms[lead_id]
            else:
                await self.broadcast(lead_id)

    async def broadcast(self, lead_id: str):
        if lead_id not in self.rooms:
            return
        active_users = list(self.rooms[lead_id].values())
        payload = {
            "type": "presence_update",
            "lead_id": lead_id,
            "active_users": active_users,
            "count": len(active_users)
        }
        for ws in list(self.rooms[lead_id].keys()):
            try:
                await ws.send_json(payload)
            except Exception:
                pass

presence_manager = PresenceManager()

@app.websocket("/ws/presence/{lead_id}")
async def presence_websocket(websocket: WebSocket, lead_id: str):
    user_name = websocket.query_params.get("user_name", "Sales Rep")
    user_id = websocket.query_params.get("user_id", "rep_1")
    user_info = {"user_name": user_name, "user_id": user_id}
    
    await presence_manager.connect(lead_id, websocket, user_info)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await presence_manager.disconnect(lead_id, websocket)
    except Exception:
        await presence_manager.disconnect(lead_id, websocket)


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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
# main.py (final version for Week 2)
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine
from app.routes import analytics, auth, company, salesperson, activities, deals, leads, pipeline


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

from app.routes.auth import router as auth_router
from app.routes.leads import router as lead_router
from app.api.voice import router as voice_router

from app.routes.ai import router as ai_router

app.include_router(auth_router)
app.include_router(lead_router)
app.include_router(voice_router)
app.include_router(company.router)
app.include_router(salesperson.router)
app.include_router(deals.router)
app.include_router(activities.router)
app.include_router(pipeline.router)
app.include_router(analytics.router)
from app.routes.teams import router as team_router
app.include_router(team_router)
app.include_router(ai_router)

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
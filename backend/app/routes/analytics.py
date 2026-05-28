from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboard, ModelTrainingMetrics
from app.services import analytics_service
from app.ml.predictor import train_and_evaluate
from app.models.ai_recommendation import AIRecommendation
from app.services.ai_campaign_optimizer import generate_campaign_insights

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboard)
def dashboard(
    date_range: str = "30 Days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """KPIs: leads, pipeline value, won revenue, win rate, activity volume, funnel."""
    return analytics_service.build_dashboard(db, current_user, date_range=date_range)


@router.get("/team-progress")
def team_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provides a detailed progress report for all teams and individual team members."""
    return analytics_service.get_team_progress_report(db)


@router.post("/train", response_model=ModelTrainingMetrics)
def train_model():
    """Train the lead scoring model from the merged dataset and return evaluation metrics."""
    return train_and_evaluate()


@router.get("/ai-insights")
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch AI Campaign insights."""
    insights = db.query(AIRecommendation).filter(AIRecommendation.is_dismissed == False).order_by(AIRecommendation.created_at.desc()).limit(10).all()
    
    # If no insights, generate some on the fly (for demo purposes)
    if not insights:
        insights = generate_campaign_insights(db)
        
    return [{"id": i.id, "insight_type": i.insight_type, "message": i.message, "campaign_id": i.campaign_id, "created_at": i.created_at} for i in insights]

@router.post("/ai-insights/generate")
def trigger_ai_insights_generation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger AI insight generation."""
    insights = generate_campaign_insights(db, force_refresh=True)
    return {"status": "success", "generated": len(insights)}

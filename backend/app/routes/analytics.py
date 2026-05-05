from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboard, ModelTrainingMetrics
from app.services import analytics_service
from app.ml.predictor import train_and_evaluate

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboard)
def dashboard(
    date_range: str = "30 Days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """KPIs: leads, pipeline value, won revenue, win rate, activity volume, funnel."""
    return analytics_service.build_dashboard(db, current_user, date_range=date_range)



@router.post("/train", response_model=ModelTrainingMetrics)
def train_model():
    """Train the lead scoring model from the merged dataset and return evaluation metrics."""
    return train_and_evaluate()

from pydantic import BaseModel


class StageFunnelItem(BaseModel):
    stage_key: str
    label: str
    open_deals: int
    open_pipeline_value: float


class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int
    unknown: int


class SalesProgress(BaseModel):
    deals_open: int
    deals_won: int
    deals_lost: int
    win_rate_pct: float | None
    pipeline_progress_pct: float | None


class AnalyticsDashboard(BaseModel):
    leads_total: int
    leads_avg_ai_score: float | None
    model_accuracy_pct: float | None
    model_rmse: float | None
    model_r2: float | None
    estimated_cost: float
    sentiment_breakdown: SentimentBreakdown
    current_sales_progress: SalesProgress
    deals_open: int
    deals_won: int
    deals_lost: int
    win_rate_pct: float | None
    revenue_won: float
    weighted_pipeline_value: float
    activities_last_7_days: int
    funnel: list[StageFunnelItem]


class ModelTrainingMetrics(BaseModel):
    available: bool
    error: str | None
    artifact: str | None
    rows: int | None
    test_rows: int | None
    trained_at: str | None
    scorer: str | None
    accuracy_pct: float | None
    score_rmse: float | None
    score_r2: float | None

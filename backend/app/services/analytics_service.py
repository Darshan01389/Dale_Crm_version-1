from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.predictor import ml_status
from app.models.activity import Activity
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.pipeline_stage import PipelineStage
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsDashboard,
    StageFunnelItem,
    SalesProgress,
    SentimentBreakdown,
)


def build_db_dashboard(db: Session, user: User, days: int = 30) -> AnalyticsDashboard:
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Filter based on role
    is_sales = user.role in ["Sales Rep", "Sales"]
    is_manager = user.role in ["Team Lead", "Manager"]
    is_admin = user.role in ["Owner / Admin", "Sales Admin"]

    if is_sales:
        base_filter_lead = (Lead.owner_id == user.id) & (Lead.created_at >= since_date)
        base_filter_deal = (Deal.owner_id == user.id) & (Deal.created_at >= since_date)
        base_filter_act = (Activity.owner_id == user.id) & (Activity.occurred_at >= since_date)
    elif is_manager:
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            base_filter_lead = (Lead.owner_id.in_(member_ids)) & (Lead.created_at >= since_date)
            base_filter_deal = (Deal.owner_id.in_(member_ids)) & (Deal.created_at >= since_date)
            base_filter_act = (Activity.owner_id.in_(member_ids)) & (Activity.occurred_at >= since_date)
        else:
            base_filter_lead = (Lead.owner_id == user.id) & (Lead.created_at >= since_date)
            base_filter_deal = (Deal.owner_id == user.id) & (Deal.created_at >= since_date)
            base_filter_act = (Activity.owner_id == user.id) & (Activity.occurred_at >= since_date)
    else: # Owner / Admin or unknown defaults to Admin for analytics
        base_filter_lead = (Lead.created_at >= since_date)
        base_filter_deal = (Deal.created_at >= since_date)
        base_filter_act = (Activity.occurred_at >= since_date)

    leads_total = (
        db.query(func.count(Lead.id)).filter(base_filter_lead).scalar() or 0
    )
    avg_score = (
        db.query(func.avg(Lead.ai_score)).filter(base_filter_lead).scalar()
    )

    sentiment_counts = {
        "positive": 0,
        "neutral": 0,
        "negative": 0,
        "unknown": 0,
    }
    for label, count in (
        db.query(Lead.sentiment_label, func.count(Lead.id))
        .filter(base_filter_lead)
        .group_by(Lead.sentiment_label)
        .all()
    ):
        key = label if label in sentiment_counts else "unknown"
        sentiment_counts[key] = int(count)

    deals_open = (
        db.query(func.count(Deal.id))
        .filter(base_filter_deal, Deal.outcome == "open")
        .scalar()
        or 0
    )
    deals_won = (
        db.query(func.count(Deal.id))
        .filter(base_filter_deal, Deal.outcome == "won")
        .scalar()
        or 0
    )
    deals_lost = (
        db.query(func.count(Deal.id))
        .filter(base_filter_deal, Deal.outcome == "lost")
        .scalar()
        or 0
    )
    closed = deals_won + deals_lost
    win_rate = (100.0 * deals_won / closed) if closed else None
    total_deals = deals_open + closed
    pipeline_progress = (
        round(100.0 * deals_won / total_deals, 2) if total_deals else None
    )

    revenue_won = (
        db.query(func.coalesce(func.sum(Deal.amount), 0.0))
        .filter(base_filter_deal, Deal.outcome == "won")
        .scalar()
        or 0.0
    )

    open_rows = (
        db.query(Deal)
        .filter(base_filter_deal, Deal.outcome == "open")
        .all()
    )
    weighted_pipeline = sum(
        float(d.amount) * (float(d.probability) / 100.0) for d in open_rows
    )
    estimated_cost = round(weighted_pipeline * 0.12, 2)

    act_count = (
        db.query(func.count(Activity.id))
        .filter(base_filter_act)
        .scalar()
        or 0
    )

    stages = db.query(PipelineStage).order_by(PipelineStage.sort_order.asc()).all()
    funnel: list[StageFunnelItem] = []
    for st in stages:
        rows = [
            d
            for d in open_rows
            if d.stage_id == st.id
        ]
        fv = sum(float(d.amount) for d in rows)
        funnel.append(
            StageFunnelItem(
                stage_key=st.stage_key,
                label=st.label,
                open_deals=len(rows),
                open_pipeline_value=fv,
            )
        )

    ml = ml_status()
    return AnalyticsDashboard(
        leads_total=int(leads_total),
        leads_avg_ai_score=float(avg_score) if avg_score is not None else None,
        model_accuracy_pct=ml.get("accuracy_pct"),
        model_rmse=ml.get("score_rmse"),
        model_r2=ml.get("score_r2"),
        estimated_cost=float(estimated_cost),
        sentiment_breakdown=SentimentBreakdown(
            positive=sentiment_counts["positive"],
            neutral=sentiment_counts["neutral"],
            negative=sentiment_counts["negative"],
            unknown=sentiment_counts["unknown"],
        ),
        current_sales_progress=SalesProgress(
            deals_open=int(deals_open),
            deals_won=int(deals_won),
            deals_lost=int(deals_lost),
            win_rate_pct=round(win_rate, 2) if win_rate is not None else None,
            pipeline_progress_pct=pipeline_progress,
        ),
        deals_open=int(deals_open),
        deals_won=int(deals_won),
        deals_lost=int(deals_lost),
        win_rate_pct=round(win_rate, 2) if win_rate is not None else None,
        revenue_won=float(revenue_won),
        weighted_pipeline_value=round(weighted_pipeline, 2),
        activities_last_7_days=int(act_count),
        funnel=funnel,
    )

def build_dataset_dashboard() -> AnalyticsDashboard:
    csv_path = Path(settings.MERGED_LEAD_DATASET_PATH)
    if not csv_path.exists():
        # Return empty dashboard if CSV also missing
        return AnalyticsDashboard(
            leads_total=0,
            leads_avg_ai_score=0,
            model_accuracy_pct=0,
            model_rmse=0,
            model_r2=0,
            estimated_cost=0,
            sentiment_breakdown=SentimentBreakdown(positive=0, neutral=0, negative=0, unknown=0),
            current_sales_progress=SalesProgress(deals_open=0, deals_won=0, deals_lost=0, win_rate_pct=0, pipeline_progress_pct=0),
            deals_open=0, deals_won=0, deals_lost=0, win_rate_pct=0, revenue_won=0.0, weighted_pipeline_value=0.0,
            activities_last_7_days=0, funnel=[]
        )

    try:
        df = pd.read_csv(csv_path)
        total_leads = len(df)
        avg_score = float(df["lead_score"].mean()) if total_leads else None
        converted = int(df["converted"].sum()) if "converted" in df.columns else 0
        not_converted = total_leads - converted
        win_rate = round(100.0 * converted / total_leads, 2) if total_leads else None

        if "lead_score" in df.columns:
            sentiment_values = pd.cut(
                df["lead_score"].fillna(0.0),
                bins=[-1.0, 40.0, 75.0, float("inf")],
                labels=["negative", "neutral", "positive"],
            ).astype(object)
        else:
            sentiment_values = pd.Series(["unknown"] * total_leads)

        sentiment_counts = {
            "positive": int((sentiment_values == "positive").sum()),
            "neutral": int((sentiment_values == "neutral").sum()),
            "negative": int((sentiment_values == "negative").sum()),
            "unknown": int((sentiment_values == "unknown").sum()),
        }
        ml = ml_status()
        estimated_cost = round(total_leads * 12.5, 2)
        funnel = []
        if "lead_tier" in df.columns:
            for label, count in df["lead_tier"].fillna("unknown").value_counts().items():
                funnel.append(
                    StageFunnelItem(
                        stage_key=label,
                        label=label.title(),
                        open_deals=int(count),
                        open_pipeline_value=0.0,
                    )
                )
        else:
            funnel.append(
                StageFunnelItem(
                    stage_key="dataset",
                    label="Dataset",
                    open_deals=total_leads,
                    open_pipeline_value=0.0,
                )
            )

        return AnalyticsDashboard(
            leads_total=int(total_leads),
            leads_avg_ai_score=float(avg_score) if avg_score is not None else None,
            model_accuracy_pct=ml.get("accuracy_pct"),
            model_rmse=ml.get("score_rmse"),
            model_r2=ml.get("score_r2"),
            estimated_cost=float(estimated_cost),
            sentiment_breakdown=SentimentBreakdown(
                positive=sentiment_counts["positive"],
                neutral=sentiment_counts["neutral"],
                negative=sentiment_counts["negative"],
                unknown=sentiment_counts["unknown"],
            ),
            current_sales_progress=SalesProgress(
                deals_open=int(not_converted),
                deals_won=int(converted),
                deals_lost=0,
                win_rate_pct=win_rate,
                pipeline_progress_pct=win_rate,
            ),
            deals_open=int(not_converted),
            deals_won=int(converted),
            deals_lost=0,
            win_rate_pct=win_rate,
            revenue_won=0.0,
            weighted_pipeline_value=0.0,
            activities_last_7_days=0,
            funnel=funnel,
        )
    except Exception:
        return AnalyticsDashboard(
            leads_total=0,
            leads_avg_ai_score=0,
            model_accuracy_pct=0,
            model_rmse=0,
            model_r2=0,
            estimated_cost=0,
            sentiment_breakdown=SentimentBreakdown(positive=0, neutral=0, negative=0, unknown=0),
            current_sales_progress=SalesProgress(deals_open=0, deals_won=0, deals_lost=0, win_rate_pct=0, pipeline_progress_pct=0),
            deals_open=0, deals_won=0, deals_lost=0, win_rate_pct=0, revenue_won=0.0, weighted_pipeline_value=0.0,
            activities_last_7_days=0, funnel=[]
        )

def build_dashboard(db: Session, user: User, date_range: str = "30 Days") -> AnalyticsDashboard:
    # Map range string to days
    days_map = {
        "7 Days": 7,
        "30 Days": 30,
        "3 Months": 90,
        "12 Months": 365
    }
    days = days_map.get(date_range, 30)
    
    try:
        dash = build_db_dashboard(db, user, days=days)
        # If DB is empty, try to show dataset instead so UI doesn't look broken
        if dash.leads_total == 0:
            return build_dataset_dashboard()
        return dash
    except Exception:
        return build_dataset_dashboard()


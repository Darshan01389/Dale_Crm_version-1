import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_key = Column(String(64), unique=True, nullable=False, index=True)
    label = Column(String(200), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_closed_won = Column(Boolean, nullable=False, default=False)
    is_closed_lost = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

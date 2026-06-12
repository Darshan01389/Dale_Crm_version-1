from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, server_default=func.now())
    priority = Column(String, default="Medium") # High, Medium, Low
    task_type = Column(String, default="Follow-up") # Call, Email, Meeting, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    from sqlalchemy.orm import relationship
    lead = relationship("Lead", backref="tasks")

    def __repr__(self):
        return f"<Task {self.title}>"

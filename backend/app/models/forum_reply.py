import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ForumReply(Base):
    __tablename__ = "forum_replies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    author = relationship("User", backref="forum_replies")
    post = relationship("ForumPost", back_populates="replies")

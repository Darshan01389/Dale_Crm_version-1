import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="General Discussion")
    
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    upvotes = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    views = Column(Integer, default=0)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    
    author = relationship("User", backref="forum_posts")

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ForumPostBase(BaseModel):
    title: str
    content: str
    category: str


class ForumPostCreate(ForumPostBase):
    pass


class ForumReplyCreate(BaseModel):
    content: str

class ForumReplyResponse(BaseModel):
    id: UUID
    post_id: UUID
    author_id: UUID
    author_name: str
    content: str
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True

class ForumPostResponse(ForumPostBase):
    id: UUID
    author_id: UUID
    author_name: str
    upvotes: int
    reply_count: int
    views: int
    created_at: datetime
    replies: list[ForumReplyResponse] = []

    class Config:
        from_attributes = True

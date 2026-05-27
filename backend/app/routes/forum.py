from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.forum_post import ForumPost
from app.schemas.forum import ForumPostCreate, ForumPostResponse

router = APIRouter(prefix="/forum", tags=["Forum"])

@router.get("/posts", response_model=list[ForumPostResponse])
def get_posts(
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(ForumPost)
    if category and category != "All":
        query = query.filter(ForumPost.category == category)
        
    posts = query.order_by(ForumPost.created_at.desc()).offset(skip).limit(limit).all()
    
    # Map author_name
    result = []
    for p in posts:
        resp = ForumPostResponse(
            id=p.id,
            title=p.title,
            content=p.content,
            category=p.category,
            author_id=p.author_id,
            author_name=p.author.name if p.author else "Unknown",
            upvotes=p.upvotes,
            reply_count=p.reply_count,
            views=p.views,
            created_at=p.created_at
        )
        result.append(resp)
        
    return result

@router.post("/posts", response_model=ForumPostResponse, status_code=201)
def create_post(
    post_in: ForumPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_post = ForumPost(
        title=post_in.title,
        content=post_in.content,
        category=post_in.category,
        author_id=current_user.id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return ForumPostResponse(
        id=new_post.id,
        title=new_post.title,
        content=new_post.content,
        category=new_post.category,
        author_id=new_post.author_id,
        author_name=current_user.name,
        upvotes=new_post.upvotes,
        reply_count=new_post.reply_count,
        views=new_post.views,
        created_at=new_post.created_at
    )

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.forum_post import ForumPost
from app.models.forum_reply import ForumReply
from app.schemas.forum import ForumPostCreate, ForumPostResponse, ForumReplyCreate, ForumReplyResponse

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
        created_at=new_post.created_at,
        replies=[]
    )

@router.get("/posts/{post_id}", response_model=ForumPostResponse)
def get_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post.views += 1
    db.commit()
    db.refresh(post)
    
    replies_resp = []
    for r in post.replies:
        replies_resp.append(
            ForumReplyResponse(
                id=r.id,
                post_id=r.post_id,
                author_id=r.author_id,
                author_name=r.author.name if r.author else "Unknown",
                content=r.content,
                upvotes=r.upvotes,
                created_at=r.created_at
            )
        )
        
    return ForumPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author_id=post.author_id,
        author_name=post.author.name if post.author else "Unknown",
        upvotes=post.upvotes,
        reply_count=post.reply_count,
        views=post.views,
        created_at=post.created_at,
        replies=replies_resp
    )

@router.post("/posts/{post_id}/reply", response_model=ForumReplyResponse, status_code=201)
def reply_to_post(
    post_id: UUID,
    reply_in: ForumReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    new_reply = ForumReply(
        post_id=post.id,
        author_id=current_user.id,
        content=reply_in.content
    )
    post.reply_count += 1
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    
    return ForumReplyResponse(
        id=new_reply.id,
        post_id=new_reply.post_id,
        author_id=new_reply.author_id,
        author_name=current_user.name,
        content=new_reply.content,
        upvotes=new_reply.upvotes,
        created_at=new_reply.created_at
    )

@router.post("/posts/{post_id}/upvote")
def upvote_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post.upvotes += 1
    db.commit()
    return {"status": "success", "upvotes": post.upvotes}

@router.patch("/posts/{post_id}", response_model=ForumPostResponse)
def edit_post(
    post_id: UUID,
    post_in: ForumPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Permission Check
    is_author = post.author_id == current_user.id
    is_admin = current_user.role in ["Owner / Admin", "Sales Admin", "admin"]
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to edit this post.")
        
    post.title = post_in.title
    post.content = post_in.content
    post.category = post_in.category
    db.commit()
    db.refresh(post)
    
    return ForumPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author_id=post.author_id,
        author_name=post.author.name if post.author else "Unknown",
        upvotes=post.upvotes,
        reply_count=post.reply_count,
        views=post.views,
        created_at=post.created_at,
        replies=[]
    )

@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    is_author = post.author_id == current_user.id
    is_admin = current_user.role in ["Owner / Admin", "Sales Admin", "admin"]
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post.")
        
    db.delete(post)
    db.commit()
    return

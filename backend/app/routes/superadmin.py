from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/superadmin", tags=["Super Admin"])

def check_superadmin(current_user: User):
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have superadmin privileges."
        )

@router.get("/approvals")
def get_approvals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_superadmin(current_user)
    
    # We want to list all users who requested Owner / Admin
    # Since requested role isn't stored explicitly, we check admin_approval_status
    users = db.query(User).filter(
        User.admin_approval_status.in_(["Pending", "Approved", "Rejected", "Expired"])
    ).order_by(User.approval_request_time.desc()).all()
    
    return users

@router.post("/approvals/{user_id}/approve")
def approve_admin(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_superadmin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check 24 hour limit
    if user.approval_request_time:
        time_diff = datetime.now(timezone.utc) - user.approval_request_time.replace(tzinfo=timezone.utc)
        if time_diff > timedelta(hours=24):
            raise HTTPException(status_code=400, detail="Cannot modify approval status after 24 hours.")
            
    user.admin_approval_status = "Approved"
    user.role = "Owner / Admin"
    
    # Generate verification code if missing
    import secrets
    if not user.verification_code and not user.is_email_verified:
        user.verification_code = str(secrets.randbelow(900000) + 100000)
        
    db.commit()
    
    # Send verification email since they are now approved
    if user.verification_code:
        from app.routes.auth import send_verification_bg
        from fastapi import BackgroundTasks
        # We can't easily inject background tasks here without changing the signature, 
        # but we can just call it directly for now or use the service
        from app.services.email_service import send_verification_email
        send_verification_email(user.email, user.verification_code)
        
    return {"message": "User approved successfully"}

@router.post("/approvals/{user_id}/reject")
def reject_admin(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_superadmin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check 24 hour limit
    if user.approval_request_time:
        time_diff = datetime.now(timezone.utc) - user.approval_request_time.replace(tzinfo=timezone.utc)
        if time_diff > timedelta(hours=24):
            raise HTTPException(status_code=400, detail="Cannot modify approval status after 24 hours.")
            
    user.admin_approval_status = "Rejected"
    user.role = "Sales Rep"
    
    db.commit()
    return {"message": "User rejected successfully"}

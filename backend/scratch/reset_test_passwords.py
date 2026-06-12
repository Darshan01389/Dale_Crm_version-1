from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()
try:
    emails = ["sales@gmail.com", "manager@gmail.com", "admin@gmail.com"]
    hashed = hash_password("123456")
    
    for email in emails:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.password_hash = hashed
            print(f"Updated password for {email}")
        else:
            print(f"User {email} not found")
    
    db.commit()
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()

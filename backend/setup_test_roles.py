
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
u1 = db.query(User).filter(User.email == "alex@example.com").first()
if u1: u1.role = "Owner / Admin"

u2 = db.query(User).filter(User.email == "testuser@example.com").first()
if u2: u2.role = "Team Lead"

db.commit()
print("Roles updated for testing.")
db.close()

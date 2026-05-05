
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f"{'Email':<30} | {'Role':<15}")
print("-" * 50)
for u in users:
    print(f"{u.email:<30} | {u.role:<15}")
db.close()

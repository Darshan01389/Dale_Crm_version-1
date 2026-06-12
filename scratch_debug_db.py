
import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.core.database import SessionLocal
from app.models.pipeline_stage import PipelineStage
from app.models.deal import Deal
from app.models.user import User

db = SessionLocal()
print("--- STAGES ---")
stages = db.query(PipelineStage).all()
for s in stages:
    print(f"{s.stage_key}: {s.label} (order: {s.sort_order})")

print("\n--- USERS & ROLES ---")
users = db.query(User).all()
for u in users:
    print(f"{u.email}: {u.role}")

print("\n--- DEALS ---")
deals = db.query(Deal).all()
print(f"Total deals: {len(deals)}")
for d in deals[:10]:
    print(f"{d.title}: {d.amount} (owner: {d.owner_id})")

db.close()

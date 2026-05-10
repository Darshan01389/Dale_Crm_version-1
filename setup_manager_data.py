
import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.team import Team
from app.models.deal import Deal
import uuid

db = SessionLocal()

# 1. Create Demo Team
team = db.query(Team).filter(Team.name == "Growth Team").first()
if not team:
    team = Team(id=uuid.uuid4(), name="Growth Team", description="Primary sales and growth team")
    db.add(team)
    db.commit()
    db.refresh(team)
    print(f"Created Team: {team.name}")
else:
    print(f"Team already exists: {team.name}")

# 2. Assign Mike Manager to Team
mike = db.query(User).filter(User.email == "mike.manager@daleiq.com").first()
if mike:
    mike.team_id = team.id
    db.commit()
    print(f"Assigned Mike Manager to {team.name}")
else:
    print("Mike Manager not found!")

# 3. Assign some deals to the team
# We'll assign Sarah Rep to the team as well, and her deals will show up for Mike
sarah = db.query(User).filter(User.email == "sarah.rep@daleiq.com").first()
if sarah:
    sarah.team_id = team.id
    db.commit()
    print(f"Assigned Sarah Rep to {team.name}")
    
    # Ensure Sarah has some deals
    deals = db.query(Deal).filter(Deal.owner_id == sarah.id).all()
    if not deals:
        from app.models.pipeline_stage import PipelineStage
        stage = db.query(PipelineStage).first()
        if stage:
            new_deal = Deal(
                id=uuid.uuid4(),
                title="Bajaj Auto Deal",
                amount=500000.0,
                owner_id=sarah.id,
                stage_id=stage.id,
                probability=50,
                outcome="open"
            )
            db.add(new_deal)
            db.commit()
            print("Created a test deal for Sarah")
    else:
        print(f"Sarah already has {len(deals)} deals")
else:
    print("Sarah Rep not found!")

db.close()
print("Done!")

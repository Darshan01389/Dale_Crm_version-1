import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.user import User
from app.models.company import Company
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.pipeline_stage import PipelineStage
from app.models.voice_recording import VoiceRecording

def init_db():
    print("Creating all tables in PostgreSQL...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[SUCCESS] All tables created successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to create tables: {e}")

if __name__ == "__main__":
    init_db()

import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.team import Team
from app.models.company import Company
from app.models.pipeline_stage import PipelineStage
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.voice_recording import VoiceRecording
from app.models.salesperson import Salesperson
# Any other models will be imported if they are in app.models.__init__.py
# But importing them explicitly is safer.

def reset_db():
    from sqlalchemy import MetaData
    print("Reflecting existing tables...")
    meta = MetaData()
    meta.reflect(bind=engine)
    print(f"Dropping {len(meta.tables)} tables...")
    meta.drop_all(bind=engine)
    print("All existing tables dropped successfully.")
    
    print("Creating all tables from current models...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")

if __name__ == "__main__":
    reset_db()

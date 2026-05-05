from sqlalchemy import create_engine, inspect
from app.core.config import settings

# Import all models to ensure they are loaded
from app.models.user import User
from app.models.lead import Lead
from app.models.company import Company
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.pipeline_stage import PipelineStage
from app.models.team import Team
from app.models.voice_recording import VoiceRecording

def inspect_foreign_keys():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    table_names = inspector.get_table_names()
    print(f"Tables found: {table_names}")
    
    for table_name in table_names:
        print(f"\n--- Checking Table: {table_name} ---")
        fks = inspector.get_foreign_keys(table_name)
        for fk in fks:
            print(f"ForeignKey in '{table_name}': {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
            # Check if referred columns exist in referred table
            referred_table = fk['referred_table']
            referred_cols = fk['referred_columns']
            if referred_table in table_names:
                table_cols = [c['name'] for c in inspector.get_columns(referred_table)]
                for rc in referred_cols:
                    if rc not in table_cols:
                        print(f"  [ERROR] Column '{rc}' NOT FOUND in table '{referred_table}'!")
                    else:
                        print(f"  [OK] Found Column '{rc}' in '{referred_table}'")
            else:
                print(f"  [ERROR] Table '{referred_table}' NOT FOUND in database!")

if __name__ == "__main__":
    inspect_foreign_keys()

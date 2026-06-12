import sys
import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres:Darshan_123@localhost:5432/voiceiq"

print(f"Checking connection to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        # Check basic connectivity
        conn.execute(text("SELECT 1"))
        print("[SUCCESS] Database connection successful!")
        
        # List tables
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in result]
        print(f"[INFO] Tables found ({len(tables)}): {', '.join(tables)}")
        
        # Check some counts
        if 'users' in tables:
            count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            print(f"[DATA] Users count: {count}")
        if 'leads' in tables:
            count = conn.execute(text("SELECT COUNT(*) FROM leads")).scalar()
            print(f"[DATA] Leads count: {count}")

except Exception as e:
    print(f"[ERROR] Connection failed: {e}")
    print("\nPlease ensure PostgreSQL is running and the credentials in .env are correct.")

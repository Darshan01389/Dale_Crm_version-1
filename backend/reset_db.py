import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def reset_database():
    # 1. Connect to default 'postgres' database
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
    db_name = settings.DATABASE_URL.rsplit('/', 1)[1]

    engine = create_engine(base_url, isolation_level="AUTOCOMMIT")
    
    print(f"Force resetting database '{db_name}'...")
    try:
        with engine.connect() as conn:
            # Terminate other sessions so we can drop the DB
            conn.execute(text(f"""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '{db_name}'
                  AND pid <> pg_backend_pid();
            """))
            print(f"Dropping database '{db_name}'...")
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            print(f"Creating database '{db_name}'...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print("Database reset successful!")
    except Exception as e:
        print(f"Error resetting database: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    reset_database()

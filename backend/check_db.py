import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def check_db():
    conn_str = "postgresql://postgres:Darshan_123@localhost:5432/postgres"
    try:
        conn = psycopg2.connect(conn_str)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # List all databases
        cur.execute("SELECT datname FROM pg_database;")
        databases = [row[0] for row in cur.fetchall()]
        print(f"Databases found: {databases}")
        
        if 'voiceiq' not in databases:
            print("Database 'voiceiq' NOT found. Attempting to create...")
            cur.execute("CREATE DATABASE voiceiq;")
            print("Database 'voiceiq' created successfully.")
        else:
            print("Database 'voiceiq' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")

if __name__ == "__main__":
    check_db()

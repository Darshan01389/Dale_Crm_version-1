import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("UPDATE users SET role = 'Sales Rep' WHERE role = 'sales_rep'"))
    conn.commit()
    print("Updated existing users' roles from 'sales_rep' to 'Sales Rep'")

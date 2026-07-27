from sqlalchemy import create_engine, text
import uuid
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

db_url = "postgresql://postgres:Jayanth_123@localhost:5432/voiceiq"
engine = create_engine(db_url)

users = [
    ("savithri.rep@daleiq.com", "Sales Rep", "Savithri Devi"),
    ("mohan.manager@daleiq.com", "Team Lead", "Mohan Kumar"),
    ("arjun.admin@daleiq.com", "Owner / Admin", "Arjun Singh")
]

password = "password123"
hashed = get_password_hash(password)

with engine.connect() as conn:
    for email, role, name in users:
        # Check if exists
        exists = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).fetchone()
        if exists:
            conn.execute(text("UPDATE users SET role = :role, name = :name, password_hash = :hash WHERE email = :email"), 
                         {"role": role, "name": name, "hash": hashed, "email": email})
        else:
            new_id = str(uuid.uuid4())
            conn.execute(text("INSERT INTO users (id, email, role, name, password_hash) VALUES (:id, :email, :role, :name, :hash)"), 
                         {"id": new_id, "email": email, "role": role, "name": name, "hash": hashed})
    conn.commit()

print("Demo accounts created successfully!")
print("1. Savithri Rep (Sales Rep) - savithri.rep@daleiq.com / password123")
print("2. Mohan Manager (Team Lead) - mohan.manager@daleiq.com / password123")
print("3. Arjun Admin (Owner / Admin) - arjun.admin@daleiq.com / password123")

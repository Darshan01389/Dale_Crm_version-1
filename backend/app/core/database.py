from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Direct PostgreSQL connection — no PgBouncer proxy, so RETURNING and
# standard connection pooling work as expected.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # detect stale connections before using them
    pool_size=5,              # keep up to 5 persistent connections
    max_overflow=10,          # allow up to 10 extra connections under load
    pool_recycle=1800,        # recycle connections every 30 min
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
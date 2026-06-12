from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Direct PostgreSQL connection — no PgBouncer proxy, so RETURNING and
# standard connection pooling work as expected.
engine_kwargs = {
    "pool_pre_ping": True,
}
if not settings.DATABASE_URL.startswith("postgres") and not settings.DATABASE_URL.startswith("postgresql"):
    raise ValueError("PostgreSQL is strictly required. SQLite is no longer supported in Phase 5.")

engine_kwargs.update({
    "pool_size": 5,
    "max_overflow": 10,
    "pool_recycle": 1800,
})

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
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
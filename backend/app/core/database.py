from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings

# Supabase PostgreSQL Session Pooler connection
# Automatically ensure postgresql+psycopg:// driver prefix for psycopg3 compatibility
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Configure robust pooling parameters tuned for Supabase Session Pooler
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=3,
    pool_timeout=20,
    pool_recycle=300,
    echo=settings.DEBUG and settings.APP_ENV == "development" and False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """Database session generator dependency with guaranteed rollback on exceptions."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_database_health() -> bool:
    """Lightweight connection probe to verify database reachability."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


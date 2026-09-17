from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings

# Supabase PostgreSQL Session Pooler connection
# Configure robust pooling parameters suitable for poolers
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=6,
    max_overflow=6,
    pool_timeout=15,
    pool_recycle=120,
    echo=settings.DEBUG and settings.APP_ENV == "development" and False  # Set True if detailed SQL queries needed
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """Database session generator dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

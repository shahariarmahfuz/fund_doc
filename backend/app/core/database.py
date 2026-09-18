from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator
import logging
from app.core.config import settings
from app.core.exceptions import DatabaseUnavailableException

logger = logging.getLogger("app.database")

# Supabase PostgreSQL Session Pooler connection
# Automatically ensure postgresql+psycopg:// driver prefix for psycopg3 compatibility
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Configure single persistent application-level connection pool
# Tuned for Supabase Session Pooler (port 5432)
engine = create_engine(
    db_url,
    pool_pre_ping=True,       # Detect dead/stale connections and automatically replace them
    pool_size=5,              # Bounded pool size suitable for Render service
    max_overflow=5,           # Allow up to 5 additional connections during peak traffic
    pool_timeout=30,          # Bounded wait time for connection acquisition
    pool_recycle=300,         # Recycle connections every 5 minutes to prevent stale sockets
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db_engine() -> None:
    """Verify database connectivity at application startup."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database engine initialized successfully. Connection pool is healthy.")
    except Exception as exc:
        logger.warning(f"Initial database ping failed during startup: {exc}. Pool will attempt reconnect on request.")

def dispose_db_engine() -> None:
    """Cleanly dispose database connection pool at application shutdown."""
    try:
        engine.dispose()
        logger.info("Database engine connection pool disposed cleanly.")
    except Exception as exc:
        logger.error(f"Error disposing database engine: {exc}")

def get_db() -> Generator[Session, None, None]:
    """
    Request-scoped database session dependency.
    Reuses a connection from the persistent application pool.
    Guarantees rollback on exception and cleanup in finally block.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error(f"Database error during request execution: {exc}")
        raise DatabaseUnavailableException("Database temporarily unavailable.") from exc
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_database_health() -> bool:
    """Lightweight connection probe to verify database reachability."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


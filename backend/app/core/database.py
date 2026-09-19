from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError, InterfaceError
from typing import Generator, Optional
import logging
from app.core.config import settings
from app.core.exceptions import DatabaseUnavailableException

logger = logging.getLogger("app.database")

# Neon PostgreSQL Connection (Pooled)
# Automatically ensure postgresql+psycopg:// driver prefix for psycopg3 compatibility
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Configure single persistent application-level connection pool
# Tuned for Neon PostgreSQL Connection Pooler
engine = create_engine(
    db_url,
    pool_pre_ping=True,       # Detect dead/stale connections and automatically replace them
    pool_size=5,              # Bounded pool size suitable for Render service
    max_overflow=5,           # Allow up to 5 additional connections during peak traffic
    pool_timeout=30,          # Bounded wait time for connection acquisition
    pool_recycle=300,         # Recycle connections every 5 minutes to prevent stale idle sockets
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    },
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db_engine() -> None:
    """Verify database connectivity at application startup and ensure schema alignment."""
    try:
        with engine.begin() as conn:
            conn.execute(text("SELECT 1"))
            # Ensure Donor mobile and nationalId allow NULLs and clean empty strings
            conn.execute(text('ALTER TABLE "Donor" ALTER COLUMN "mobile" DROP NOT NULL;'))
            conn.execute(text("UPDATE \"Donor\" SET \"mobile\" = NULL WHERE \"mobile\" = '' OR \"mobile\" = 'None';"))
            conn.execute(text("UPDATE \"Donor\" SET \"nationalId\" = NULL WHERE \"nationalId\" = '' OR \"nationalId\" = 'None';"))
        logger.info("Database engine initialized successfully. Connection pool ready.")
    except Exception as exc:
        logger.warning(f"Initial database connectivity probe failed during startup: {exc}. Pool will attempt reconnect on request.")

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
    If a stale/dead connection is detected, invalidates it so the pool replaces it.
    """
    db = SessionLocal()
    try:
        yield db
    except (OperationalError, InterfaceError) as exc:
        try:
            db.rollback()
        except Exception:
            pass
        try:
            db.invalidate()
        except Exception:
            pass
        logger.error(f"Database connection error during request execution: {exc}")
        raise DatabaseUnavailableException("Database temporarily unavailable. Please try again shortly.") from exc
    except SQLAlchemyError as exc:
        try:
            db.rollback()
        except Exception:
            pass
        logger.error(f"Database error during request execution: {exc}")
        raise DatabaseUnavailableException("Database temporarily unavailable. Please try again shortly.") from exc
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        db.close()

def get_optional_db() -> Generator[Optional[Session], None, None]:
    """
    Optional database session dependency for stateless endpoints.
    Yields a Session if available, or None if the database is unreachable.
    Never raises DatabaseUnavailableException on connection acquisition.
    """
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning(f"Optional database session unavailable: {exc}")
        if db:
            try:
                db.rollback()
                db.close()
            except Exception:
                pass
        db = None

    try:
        yield db
    except Exception:
        if db:
            try:
                db.rollback()
            except Exception:
                pass
        raise
    finally:
        if db:
            try:
                db.close()
            except Exception:
                pass

def check_database_health() -> bool:
    """Lightweight connection probe to verify database reachability."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        return False


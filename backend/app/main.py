from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.exceptions import (
    APIException,
    DatabaseUnavailableException,
    api_exception_handler,
    database_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.core.database import init_db_engine, dispose_db_engine
from app.api.v1.router import api_router

# Initialize structured logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup: Initialize persistent application-level DB pool
    logger.info("Initializing persistent application database connection pool...")
    init_db_engine()
    yield
    # Application shutdown: Dispose persistent DB pool cleanly
    logger.info("Disposing application database connection pool...")
    dispose_db_engine()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

import time
from fastapi import Request

# Configure CORS with explicit allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Process-Time"]
)

@app.middleware("http")
async def performance_telemetry_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"
    if duration_ms > 500:
        logger.warning(f"[SLOW-REQ] {request.method} {request.url.path} took {duration_ms:.2f}ms")
    return response

# Register standardized error handlers
# Dedicated database connectivity error handler (HTTP 503)
app.add_exception_handler(DatabaseUnavailableException, api_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include API Routers (supports both /api/v1 and /api)
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

from fastapi import Response
from app.core.database import check_database_health

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check(response: Response):
    db_healthy = check_database_health()
    status_str = "healthy" if db_healthy else "degraded"
    if not db_healthy:
        response.status_code = 503

    return {
        "status": status_str,
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "services": {
            "api": "up",
            "database": "connected" if db_healthy else "unreachable",
            "cache": "operational"
        }
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Disabled in production",
        "status": "running"
    }

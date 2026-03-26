"""
OWASP Enterprise Pentesting Platform - Backend API
Main application entry point with all routes, middleware, and configuration.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .database import engine, Base
from .utils.config import settings
from .utils.logger import setup_logging
from .utils.auth import get_current_user
from .websocket import manager
from .routes import (
    auth,
    scans,
    targets,
    findings,
    reports,
    automation,
    compliance,
    integrations,
    monitoring,
    users,
)

# ------------------------------------------------------------------------------
# Logging setup
setup_logging()
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------------------
# Database tables creation (in production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------------------
# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# ------------------------------------------------------------------------------
# Lifespan context manager (for startup/shutdown events)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    logger.info("Starting OWASP Enterprise Pentesting Platform API")
    yield
    logger.info("Shutting down OWASP Enterprise Pentesting Platform API")

# ------------------------------------------------------------------------------
# FastAPI app instance
app = FastAPI(
    title="OWASP Enterprise Pentesting Platform",
    description="Comprehensive security testing platform with OWASP Top 10 coverage",
    version="5.0.1",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------------------
# Exception handlers
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": exc.errors()},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP exception: {exc.detail} (status={exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# ------------------------------------------------------------------------------
# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# ------------------------------------------------------------------------------
# Include routers
app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(targets.router)
app.include_router(findings.router)
app.include_router(reports.router)
app.include_router(automation.router)
app.include_router(compliance.router)
app.include_router(integrations.router)
app.include_router(monitoring.router)
app.include_router(users.router)

# ------------------------------------------------------------------------------
# Health check endpoint
@app.get("/health")
@limiter.limit("30/minute")
async def health_check(request: Request):
    """Health check for container orchestration."""
    return {
        "status": "healthy",
        "version": "5.0.1",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ------------------------------------------------------------------------------
# WebSocket endpoint for real‑time updates
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """WebSocket connection for monitoring or scan progress."""
    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep connection alive and process incoming messages if any
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
        logger.info(f"WebSocket disconnected from channel: {channel}")

# ------------------------------------------------------------------------------
# Root endpoint
@app.get("/")
async def root():
    """API root with basic information."""
    return {
        "name": "OWASP Enterprise Pentesting Platform API",
        "version": "5.0.1",
        "status": "operational",
        "documentation": "/docs",
    }

# ------------------------------------------------------------------------------
# Optional: Prometheus metrics endpoint (for monitoring)
@app.get("/metrics")
@limiter.limit("100/minute")
async def metrics(request: Request):
    """Prometheus metrics endpoint (simplified)."""
    # In a real implementation, we would expose Prometheus metrics.
    return {"message": "Metrics endpoint – integrate with prometheus_client"}

# ------------------------------------------------------------------------------
# If run directly, start uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
        workers=4 if not settings.DEBUG else 1,
    )
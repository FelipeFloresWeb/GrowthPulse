"""GrowthPulse Marketing Intelligence Platform - FastAPI Backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import tasks, upload
from app.workers.processor import start_worker, stop_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background worker on startup, stop on shutdown."""
    await start_worker()
    yield
    await stop_worker()


app = FastAPI(
    title="GrowthPulse",
    description="Marketing Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload.router)
app.include_router(tasks.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "growthpulse"}

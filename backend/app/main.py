"""FastAPI application entrypoint for the Interview Grind backend.

Run locally:
    cd backend
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import store
from .config import settings
from .routers import problems, system_design

app = FastAPI(
    title="Interview Grind API",
    description="LeetCode-style practice + system-design prep. Python-only code sandbox.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems.router)
app.include_router(system_design.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "language": settings.language,
        "problems": len(store.all_problems()),
        "sandbox_timeout_seconds": settings.sandbox_timeout_seconds,
    }


@app.get("/", tags=["meta"])
def root():
    return {"name": "Interview Grind API", "docs": "/docs", "health": "/api/health"}

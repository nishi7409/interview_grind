"""System-design practice content endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import store
from ..models import SystemDesignContent

router = APIRouter(prefix="/api/system-design", tags=["system-design"])


@router.get("", response_model=SystemDesignContent)
def get_content():
    return SystemDesignContent(**store.system_design())


@router.get("/questions")
def list_questions():
    return store.system_design().get("questions", [])


@router.get("/questions/{slug}")
def get_question(slug: str):
    for q in store.system_design().get("questions", []):
        if q["slug"] == slug:
            return q
    raise HTTPException(status_code=404, detail=f"Question '{slug}' not found")

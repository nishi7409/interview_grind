"""Problem browsing + code execution endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import (
    Problem,
    ProblemList,
    ProblemSummary,
    RunRequest,
    RunResult,
    SubmitRequest,
    SubmitResult,
)
from ..sandbox import grade, run_free

router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.get("", response_model=ProblemList)
def list_problems(
    difficulty: str | None = Query(None, description="Easy | Medium | Hard"),
    tag: str | None = Query(None, description="Filter by a single tag"),
    q: str | None = Query(None, description="Case-insensitive title search"),
):
    items = store.all_problems()
    total = len(items)
    if difficulty:
        items = [p for p in items if p["difficulty"].lower() == difficulty.lower()]
    if tag:
        items = [p for p in items if tag in p.get("tags", [])]
    if q:
        ql = q.lower()
        items = [p for p in items if ql in p["title"].lower()]
    summaries = [ProblemSummary(**{k: p[k] for k in ("slug", "id", "title", "difficulty") if k in p},
                                tags=p.get("tags", []), companies=p.get("companies", []))
                 for p in items]
    return ProblemList(total=total, count=len(summaries), problems=summaries)


@router.get("/tags", response_model=list[str])
def list_tags():
    return store.all_tags()


@router.get("/{slug}", response_model=Problem)
def get_problem(slug: str):
    p = store.get_problem(slug)
    if not p:
        raise HTTPException(status_code=404, detail=f"Problem '{slug}' not found")
    return Problem(**p)


@router.post("/run", response_model=RunResult)
def run_code(req: RunRequest):
    """Free-run: execute the submitted Python in the sandbox (no grading)."""
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code is empty")
    return RunResult(**run_free(req.code, req.stdin))


@router.post("/{slug}/submit", response_model=SubmitResult)
def submit_solution(slug: str, req: SubmitRequest):
    """Grade a submission against the problem's test cases in the sandbox."""
    p = store.get_problem(slug)
    if not p:
        raise HTTPException(status_code=404, detail=f"Problem '{slug}' not found")
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code is empty")
    result = grade(
        code=req.code,
        entry_point=p["entry_point"],
        test_cases=p.get("test_cases", []),
        compare=p.get("compare"),
    )
    return SubmitResult(**result)

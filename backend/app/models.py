"""Pydantic models for API requests and responses."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Example(BaseModel):
    input: str
    output: str
    explanation: str = ""


class ProblemSummary(BaseModel):
    slug: str
    id: int
    title: str
    difficulty: str
    tags: list[str] = []
    companies: list[str] = []


class Problem(ProblemSummary):
    description: str
    examples: list[Example] = []
    constraints: list[str] = []
    hints: list[str] = []
    entry_point: str
    starter_code: str
    language: str = "python"


class ProblemList(BaseModel):
    total: int
    count: int
    problems: list[ProblemSummary]


# ---- Sandbox / execution ----

class RunRequest(BaseModel):
    code: str = Field(..., description="Python source containing a Solution class")
    stdin: str = Field("", description="Optional stdin fed to the program")


class SubmitRequest(BaseModel):
    code: str = Field(..., description="Python source containing a Solution class")


class TestResult(BaseModel):
    index: int
    passed: bool
    input: Any = None
    expected: Any = None
    got: Any = None
    error: str | None = None


class RunResult(BaseModel):
    ok: bool
    stdout: str = ""
    stderr: str = ""
    error: str | None = None
    duration_ms: int = 0


class SubmitResult(BaseModel):
    passed: bool
    total: int
    passed_count: int
    results: list[TestResult] = []
    error: str | None = None
    duration_ms: int = 0


# ---- System design ----

class SystemDesignContent(BaseModel):
    delivery_framework: dict[str, Any]
    interview_types: list[dict[str, Any]]
    rubric: list[dict[str, Any]]
    topics: list[dict[str, Any]]
    questions: list[dict[str, Any]]
    prep_guidance: dict[str, Any]
    source: str

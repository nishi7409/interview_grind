"""Loads and caches the curated problem + system-design datasets from JSON."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from .config import settings


@lru_cache(maxsize=1)
def _load_problems_raw() -> dict[str, Any]:
    with open(settings.problems_path, encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def _problems_by_slug() -> dict[str, dict[str, Any]]:
    data = _load_problems_raw()
    return {p["slug"]: p for p in data.get("problems", [])}


def all_problems() -> list[dict[str, Any]]:
    return list(_problems_by_slug().values())


def get_problem(slug: str) -> dict[str, Any] | None:
    return _problems_by_slug().get(slug)


def all_tags() -> list[str]:
    tags: set[str] = set()
    for p in all_problems():
        tags.update(p.get("tags", []))
    return sorted(tags)


@lru_cache(maxsize=1)
def system_design() -> dict[str, Any]:
    with open(settings.system_design_path, encoding="utf-8") as fh:
        return json.load(fh)

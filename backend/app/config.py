"""Application configuration.

Values can be overridden via environment variables (see .env.example).
"""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


class Settings:
    # Data sources (override with absolute paths to swap in a larger dataset)
    problems_path: Path = Path(os.getenv("PROBLEMS_PATH", str(DATA_DIR / "problems.json")))
    system_design_path: Path = Path(
        os.getenv("SYSTEM_DESIGN_PATH", str(DATA_DIR / "system_design.json"))
    )

    # CORS: comma-separated list of allowed origins for the React frontend
    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    # Sandbox limits
    sandbox_timeout_seconds: float = float(os.getenv("SANDBOX_TIMEOUT_SECONDS", "6"))
    sandbox_max_output_bytes: int = int(os.getenv("SANDBOX_MAX_OUTPUT_BYTES", "65536"))
    # Only supported language is python (per project scope)
    language: str = "python"


settings = Settings()

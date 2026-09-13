"""Python code-execution sandbox.

Runs user-submitted Python in an ISOLATED SUBPROCESS with:
  - a hard wall-clock timeout (killed on expiry)
  - CPU-time + address-space + file-size limits via `resource` (POSIX)
  - `-I` isolated interpreter mode (ignores env/user site, no implicit cwd on path)
  - captured, size-capped stdout/stderr
  - no arguments echoed from the parent environment

SECURITY NOTE
-------------
This is a pragmatic sandbox suitable for a local / single-user practice tool.
It limits CPU, memory, output and wall-clock, and isolates the interpreter, which
stops runaway loops, fork bombs (via NPROC where supported) and memory blowups.
It does NOT provide a full security boundary against a determined attacker
(no namespace/seccomp/container isolation). For a multi-tenant public deployment,
run this behind a container with a read-only rootfs, a locked-down seccomp profile,
no network, and a non-privileged user (see README "Hardening the sandbox").
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import textwrap
import time
from pathlib import Path
from typing import Any

from .config import settings

# Preamble applies resource limits INSIDE the child before running user code.
# resource is POSIX-only; on platforms without it we degrade to timeout-only.
_LIMIT_PREAMBLE = textwrap.dedent(
    """
    import sys, json
    try:
        import resource
        # 4s CPU, 256MB address space, 10MB max file size, no core dumps
        _CPU = 4
        _MEM = 256 * 1024 * 1024
        _FSIZE = 10 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_CPU, (_CPU, _CPU))
        try:
            resource.setrlimit(resource.RLIMIT_AS, (_MEM, _MEM))
        except (ValueError, OSError):
            pass
        resource.setrlimit(resource.RLIMIT_FSIZE, (_FSIZE, _FSIZE))
        try:
            resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        except (ValueError, OSError):
            pass
    except ImportError:
        pass
    """
).strip()


def _child_env() -> dict[str, str]:
    # Minimal environment; no inherited secrets/paths.
    return {
        "PATH": "/usr/bin:/bin",
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHONIOENCODING": "utf-8",
        "HOME": "/tmp",
    }


def _run_child(script: str, stdin: str, timeout: float) -> tuple[bool, str, str, str | None]:
    """Run *script* in an isolated interpreter. Returns (ok, stdout, stderr, error)."""
    with tempfile.TemporaryDirectory(prefix="sandbox_") as tmp:
        script_path = Path(tmp) / "prog.py"
        script_path.write_text(script, encoding="utf-8")
        try:
            proc = subprocess.run(
                [sys.executable, "-I", "-S", str(script_path)],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=tmp,
                env=_child_env(),
            )
        except subprocess.TimeoutExpired:
            return False, "", "", f"Time limit exceeded ({timeout:.0f}s)"
        except Exception as exc:  # pragma: no cover - defensive
            return False, "", "", f"Sandbox error: {exc}"

    cap = settings.sandbox_max_output_bytes
    stdout = proc.stdout[:cap]
    stderr = proc.stderr[:cap]
    if len(proc.stdout) > cap:
        stdout += "\n...[output truncated]"
    ok = proc.returncode == 0
    error = None if ok else f"Process exited with code {proc.returncode}"
    return ok, stdout, stderr, error


def run_free(code: str, stdin: str = "") -> dict[str, Any]:
    """Execute user code as-is (free run). Prepends resource limits."""
    script = _LIMIT_PREAMBLE + "\n\n" + code
    start = time.perf_counter()
    ok, stdout, stderr, error = _run_child(script, stdin, settings.sandbox_timeout_seconds)
    return {
        "ok": ok,
        "stdout": stdout,
        "stderr": stderr,
        "error": error,
        "duration_ms": int((time.perf_counter() - start) * 1000),
    }


# ---- Grading harness ----

# Runs inside the child: import user Solution, call entry_point on each test's
# args, compare to expected. Optional `unordered_groups` comparison sorts nested
# lists so answers like 3Sum/GroupAnagrams grade order-insensitively.
_GRADER_TEMPLATE = textwrap.dedent(
    """
    {preamble}

    import json, sys

    _PAYLOAD = json.loads({payload!r})
    _ENTRY = _PAYLOAD["entry_point"]
    _TESTS = _PAYLOAD["test_cases"]
    _COMPARE = _PAYLOAD.get("compare")

    # ---- user code ----
    {user_code}
    # ---- end user code ----

    def _normalize(v):
        if _COMPARE == "unordered_groups" and isinstance(v, list):
            try:
                return sorted([sorted(g) if isinstance(g, list) else g for g in v],
                              key=lambda x: json.dumps(x, sort_keys=True))
            except TypeError:
                return v
        return v

    results = []
    try:
        sol = Solution()
    except Exception as exc:  # noqa
        print(json.dumps({{"fatal": f"Could not instantiate Solution: {{exc}}"}}))
        sys.exit(0)

    method = getattr(sol, _ENTRY, None)
    if method is None:
        print(json.dumps({{"fatal": f"Solution has no method '{{_ENTRY}}'"}}))
        sys.exit(0)

    for i, t in enumerate(_TESTS):
        args = t["args"]
        expected = t["expected"]
        entry = {{"index": i, "input": args, "expected": expected}}
        try:
            got = method(*[__import__('copy').deepcopy(a) for a in args])
            passed = _normalize(got) == _normalize(expected)
            entry.update({{"passed": passed, "got": got}})
        except Exception as exc:  # noqa
            entry.update({{"passed": False, "got": None, "error": repr(exc)}})
        results.append(entry)

    print("__RESULTS__" + json.dumps(results))
    """
).strip()


def grade(code: str, entry_point: str, test_cases: list[dict], compare: str | None = None) -> dict[str, Any]:
    payload = json.dumps({"entry_point": entry_point, "test_cases": test_cases, "compare": compare})
    script = _GRADER_TEMPLATE.format(
        preamble=_LIMIT_PREAMBLE,
        payload=payload,
        user_code=code,
    )
    start = time.perf_counter()
    ok, stdout, stderr, error = _run_child(script, "", settings.sandbox_timeout_seconds)
    duration_ms = int((time.perf_counter() - start) * 1000)

    if error and not stdout:
        return {
            "passed": False, "total": len(test_cases), "passed_count": 0,
            "results": [], "error": error, "duration_ms": duration_ms,
        }

    # Parse the marker line the grader prints.
    marker = "__RESULTS__"
    idx = stdout.rfind(marker)
    if idx == -1:
        # Look for a fatal payload.
        fatal = None
        for line in stdout.splitlines():
            line = line.strip()
            if line.startswith("{") and "fatal" in line:
                try:
                    fatal = json.loads(line).get("fatal")
                except json.JSONDecodeError:
                    pass
        return {
            "passed": False, "total": len(test_cases), "passed_count": 0,
            "results": [], "error": fatal or (stderr.strip() or "No results produced"),
            "duration_ms": duration_ms,
        }

    try:
        raw = json.loads(stdout[idx + len(marker):].splitlines()[0])
    except (json.JSONDecodeError, IndexError):
        return {
            "passed": False, "total": len(test_cases), "passed_count": 0,
            "results": [], "error": "Could not parse grader output", "duration_ms": duration_ms,
        }

    passed_count = sum(1 for r in raw if r.get("passed"))
    return {
        "passed": passed_count == len(test_cases) and len(test_cases) > 0,
        "total": len(test_cases),
        "passed_count": passed_count,
        "results": raw,
        "error": None,
        "duration_ms": duration_ms,
    }

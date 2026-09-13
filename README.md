# interview_grind

A focused **LeetCode + system-design interview practice platform**, inspired by
[HelloInterview](https://www.hellointerview.com/). Browse and solve classic coding
problems in an in-browser **Python** sandbox (run + graded submit), and study a
structured system-design curriculum (delivery framework, interviewer rubric, and
practice prompts).

- **Frontend:** React (Vite), design system based on the **Linear** profile from
  [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md) —
  dark-first, single lavender accent, mono code surfaces.
- **Backend:** FastAPI, with a sandboxed Python code runner.
- **Language:** coding problems are **Python-only**.

---

## Repository layout

```
interview_grind/
├── backend/                 FastAPI API + Python code sandbox
│   ├── app/
│   │   ├── main.py          app + CORS + health
│   │   ├── config.py        env-overridable settings
│   │   ├── models.py        Pydantic schemas
│   │   ├── store.py         cached JSON dataset loader
│   │   ├── sandbox.py       isolated-subprocess Python runner + grader
│   │   ├── routers/         /api/problems, /api/system-design
│   │   └── data/            problems.json, system_design.json (seed data)
│   ├── tests/               pytest endpoint + sandbox tests
│   └── requirements.txt
└── frontend/                React (Vite) SPA
    ├── src/
    │   ├── pages/           Home, Problems, ProblemDetail, SystemDesign
    │   ├── components/      CodeEditor (Python), UI primitives
    │   ├── api.js           backend client
    │   └── index.css        Linear design tokens
    └── vite.config.js       dev proxy /api -> backend
```

---

## Prerequisites

- **Python** 3.11+ (sandbox resource limits use POSIX `resource`, i.e. Linux/macOS)
- **Node.js** 20+ and npm

---

## Backend — setup & run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run the API (http://127.0.0.1:8000, docs at /docs)
uvicorn app.main:app --reload --port 8000
```

Run the tests:

```bash
cd backend
source .venv/bin/activate
pytest -q
```

### Backend configuration (optional)

Copy `backend/.env.example` and export the variables, or set them inline. Defaults work out of the box.

| Variable | Default | Purpose |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `PROBLEMS_PATH` | `app/data/problems.json` | Swap in a larger problem dataset |
| `SYSTEM_DESIGN_PATH` | `app/data/system_design.json` | Swap in system-design content |
| `SANDBOX_TIMEOUT_SECONDS` | `6` | Wall-clock limit per execution |
| `SANDBOX_MAX_OUTPUT_BYTES` | `65536` | Output cap per execution |

### Key endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health + problem count |
| GET | `/api/problems` | List; filter by `difficulty`, `tag`, `q` |
| GET | `/api/problems/tags` | All tags |
| GET | `/api/problems/{slug}` | Full problem (description, examples, starter code) |
| POST | `/api/problems/run` | Free-run Python in the sandbox |
| POST | `/api/problems/{slug}/submit` | Grade a submission against test cases |
| GET | `/api/system-design` | Framework, rubric, interview types, questions |

---

## Frontend — setup & run

```bash
cd frontend
npm install

# Dev server (http://127.0.0.1:5173). It proxies /api to the backend on :8000.
npm run dev

# Production build
npm run build
npm run preview
```

Start the **backend first** (port 8000), then the frontend — the Vite dev server
proxies `/api` to it. Override the backend target with `VITE_API_TARGET`, or set
`VITE_API_BASE` for a production deployment (see `frontend/.env.example`).

---

## Data sources & assumptions

- **LeetCode problems:** LeetCode has no official public API, and scraping their
  GraphQL endpoint is fragile and ToS-gray. This project therefore ships a
  **curated static JSON seed** (`backend/app/data/problems.json`) of 12 classic
  problems, each with a description, examples, constraints, hints, Python starter
  code, an `entry_point`, and `test_cases` used to grade submissions. To expand,
  add records matching the schema or point `PROBLEMS_PATH` at a larger dump.
- **System design content** is seeded from HelloInterview's "System Design in a
  Hurry" (the uploaded PDF contained only the Introduction chapter, so the
  interviewer rubric, interview types, and prep guidance are taken verbatim from
  it; the delivery-framework steps and topic bodies are a standard skeleton marked
  for expansion — no PDF content was fabricated).

---

## Hardening the sandbox (production)

The sandbox (`backend/app/sandbox.py`) runs untrusted Python in an isolated
subprocess (`python -I -S`) with a wall-clock timeout, POSIX `resource` limits
(CPU, address space, file size, no core dumps), a minimal environment, and
size-capped output. This is appropriate for **local / single-user** use.

For a **multi-tenant public deployment**, run each execution inside a container
with:
- a read-only root filesystem and a non-privileged user,
- **no network** (`--network none`),
- a locked-down `seccomp` profile and dropped Linux capabilities,
- cgroup CPU/memory limits and a PID limit (anti-fork-bomb).

---

## License

See repository settings.

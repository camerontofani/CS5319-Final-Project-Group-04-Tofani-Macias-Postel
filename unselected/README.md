# SmartStudy — Microservices (Option 2)

Same React UI as `selected/`, but the backend is split into separate services behind an API gateway. Each service uses its own SQLite file. The browser only talks to the gateway on port **8000**; the gateway calls services over HTTP and passes `X-User-Id` after validating the JWT.

## Architecture

| Component | Port | Role |
|-----------|------|------|
| API Gateway | 8000 | JWT check, `/api/*`, merges `GET/PATCH /api/user-state` |
| Auth | 8101 | Users, passwords, tokens, `profile` JSON |
| Study Plan | 8102 | Plan, course draft, deadlines, completed task keys |
| Progress | 8103 | Progress logs |
| Groups | 8104 | Study groups, group data, check-ins |
| Notifications | 8105 | In-memory event buffer (demo only) |
| AI service | 8106 | Suggestion text for the Recommendations page |

After a group check-in, the gateway can POST to the notification service. If that call fails, the rest of the flow still works.

## Prerequisites

- Python 3.11+ and `pip`
- Node.js 18+ for the frontend

## Backend: install (once)

From `unselected/backend`, one venv is enough:

```bash
cd unselected/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r gateway/requirements.txt
pip install -r services/auth-service/requirements.txt
pip install -r services/study-plan-service/requirements.txt
pip install -r services/progress-service/requirements.txt
pip install -r services/group-service/requirements.txt
pip install -r services/notification-service/requirements.txt
pip install -r services/ai-service/requirements.txt
```

Copy env — **gateway and auth must share the same `SECRET_KEY`** or tokens will not validate:

```bash
cp .env.example .env
export $(grep -v '^#' .env | xargs)   # or `source .env` in bash
```

## Run everything

```bash
chmod +x unselected/scripts/run-microservices.sh
./unselected/scripts/run-microservices.sh
```

Or start each process yourself from `unselected/backend` (venv on, `SECRET_KEY` set):

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8101   # cd services/auth-service
uvicorn app.main:app --host 127.0.0.1 --port 8102   # cd services/study-plan-service
uvicorn app.main:app --host 127.0.0.1 --port 8103   # cd services/progress-service
uvicorn app.main:app --host 127.0.0.1 --port 8104   # cd services/group-service
uvicorn app.main:app --host 127.0.0.1 --port 8105   # cd services/notification-service
uvicorn app.main:app --host 127.0.0.1 --port 8106   # cd services/ai-service
uvicorn app.main:app --host 127.0.0.1 --port 8000   # cd gateway
```

Smoke test: `http://127.0.0.1:8000/health` and `http://127.0.0.1:8000/routes`.

## Frontend

CRA proxy points at port 8000. Same routes as the monolith (`/api/auth/*`, `/api/user-state`, etc.).

```bash
cd unselected/frontend
npm install
npm start
```

## SQLite files

Each service creates its DB next to where you started `uvicorn`. If you start from different folders, you get different files — same pitfall as the monolith. Use the script or stay consistent.

## Compared to `selected/`

| | `selected/` | `unselected/` |
|--|-------------|----------------|
| UI | React | Same |
| API | One FastAPI app | Gateway on :8000 |
| DB | One `smartstudy.db` | One file per service |

## Seven processes, no Compose

You need seven `uvicorn` processes (six services + gateway). Either seven terminals or the run script. We skipped Docker Compose so the project runs with just Python and `pip` — no images, no compose file to maintain for this version.

## Odds and ends

- **Notifications:** not persisted; restart clears the buffer.
- **JWT:** only the gateway decodes the token; other services see `X-User-Id` from the gateway. Auth and gateway still need the same `SECRET_KEY`.
- **Frontend:** same data layer as the monolith; point it at port **8000** (proxy or `REACT_APP_API_URL`).

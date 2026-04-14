# Selected: Layered monolith

This version keeps all backend features inside one FastAPI app.

## Simple structure

- `frontend/` - monolith UI (React + Vite)
- `backend/app/main.py` - app entrypoint
- `backend/app/api/` - HTTP routes
- `backend/app/services/` - business logic by feature

## Current milestone shell

- Milestone 1: `POST /api/auth/signup`
- Milestone 2: `POST /api/plans/generate`
- Milestone 3: `POST /api/progress/log`
- Milestone 4: `POST /api/groups/checkin`
- Milestone 5: `POST /api/ai/recommend`
- Milestone 6: testing and documentation (next)

## Run

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` (see `src/pages/` for screens a–f).

Optional: copy `.env.example` to `.env` if you change the api port.

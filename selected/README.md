# SmartStudy — `selected/` (layered modular backend)

This folder is a **self-contained** copy of the product: React frontend + one FastAPI backend process. The backend is organized in **layers** (API → services → repositories / models → SQLite) so features stay separated even though everything runs in a single app.

## How this relates to the repo

The repository root keeps **two** full implementations side by side (`selected/` and `unselected/`). They do **not** share backend code. This README only describes the tree under **`selected/`**.

## Folder structure

```
selected/
├── frontend/                 # Create React App (same UI concepts as unselected)
│   ├── public/
│   ├── src/                  # pages, context, components, styles
│   └── package.json          # dev server; `proxy` → http://127.0.0.1:8000
│
└── backend/                  # Single FastAPI application
    ├── requirements.txt
    ├── .env.example          # copy to `.env` (SECRET_KEY, optional OPENAI_*)
    └── app/
        ├── main.py           # app factory, CORS, DB create on startup
        ├── api/              # HTTP routes, auth endpoints, dependencies
        ├── core/             # settings, security (JWT)
        ├── db/               # SQLAlchemy engine, session, Base
        ├── models/           # ORM models
        ├── repositories/     # persistence helpers
        ├── schemas/          # Pydantic / request–response shapes
        └── services/         # business logic (auth, plan, progress, groups, AI)
```

**Frontend** talks only to the backend origin you configure (default: CRA `proxy` to port **8000**). **Backend** exposes `/api/...` routes and uses one SQLite file (created next to where you run `uvicorn`, typically `selected/backend/`).

## Prerequisites

- Python **3.11+** and `pip`
- Node.js **18+** and `npm`

## Backend: install and run

From the repo root (or adjust paths):

```bash
cd selected/backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # set SECRET_KEY; add OPENAI_API_KEY for live AI
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`

## Frontend: install and run

```bash
cd selected/frontend
npm install
npm start
```

Opens **http://localhost:3000** (or the next free port). Ensure the backend is on **8000** or set `REACT_APP_API_URL` / proxy accordingly.

## Optional: production-style frontend build

```bash
cd selected/frontend
npm run build
```

Serve the `build/` folder with any static host; point API calls at the same backend base URL (CORS is already allowed for localhost dev origins in `app/main.py`).

## See also

- `unselected/README.md` — the **other** architecture in this repo (gateway + separate services), with its own frontend copy.

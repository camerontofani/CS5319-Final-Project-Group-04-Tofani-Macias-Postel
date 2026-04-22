# SmartStudy — `selected/` (layered modular backend)

This folder is a **self-contained** copy of the product: React frontend + **one** FastAPI backend process. The backend is organized in **layers** (API → services → repositories / models → SQLite) so features stay separated even though everything runs in a single process.

## How this relates to the repo

The repository root keeps **two** full implementations side by side (`selected/` and `unselected/`). They do **not** share backend code. This README only describes the tree under **`selected/`**.

---

## Run locally — step-by-step (read this first)

**Repository root** means the folder that contains **`selected/`** and **`unselected/`** together. In the examples below, replace `~/SmartStudy` with the path where you cloned the repo (e.g. `/Users/camtofani/SmartStudy`).

### First time on this machine

**Terminal 1 — backend (port 8000)**

```bash
cd ~/SmartStudy/selected/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Leave this running. You should see Uvicorn listening on **http://127.0.0.1:8000**. Check: open or run `curl -s http://127.0.0.1:8000/health` — you should see JSON including `"architecture":"layered-monolith"`.

**Terminal 2 — frontend (port 3000 or next free port)**

```bash
cd ~/SmartStudy/selected/frontend
npm install
npm start
```

The first time, **`npm install` is required** (otherwise `react-scripts: command not found`). When CRA opens, use **http://localhost:3000** (or the URL it prints). The app proxies API calls to **http://127.0.0.1:8000** via `package.json` → `proxy`.

**Optional env file (backend):** from `selected/backend`, `cp .env.example .env` and set `SECRET_KEY` and/or `OPENAI_API_KEY` if you need a custom secret or live OpenAI calls. Defaults in code are enough for a quick local run.

### Every later session

**Terminal 1:**

```bash
cd ~/SmartStudy/selected/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2:**

```bash
cd ~/SmartStudy/selected/frontend
npm start
```

### Important

- **Do not** run the **`unselected/`** microservice **gateway** at the same time on **port 8000** — only one process can bind there. Stop the `selected` backend before starting `unselected`, and vice versa.
- **Windows:** use `.venv\Scripts\activate` instead of `source .venv/bin/activate`.

---

## Folder structure

```
selected/
├── frontend/                 # Create React App
│   ├── public/
│   ├── src/
│   └── package.json          # `proxy` → http://127.0.0.1:8000
│
└── backend/
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py
        ├── api/
        ├── core/
        ├── db/
        ├── models/
        ├── repositories/
        ├── schemas/
        └── services/
```

**Database:** SQLite file **`selected/backend/smartstudy.db`** (path is fixed relative to the backend package).

## Optional: production-style frontend build

```bash
cd ~/SmartStudy/selected/frontend
npm run build
```

Serve the `build/` folder with any static host; point API calls at the same backend base URL (CORS already allows common localhost origins in `app/main.py`).

## Prerequisites (summary)

- Python **3.11+** and `pip`
- Node.js **18+** and `npm`

## See also

- `unselected/README.md` — gateway + microservices variant (different backend, own `frontend/` copy).

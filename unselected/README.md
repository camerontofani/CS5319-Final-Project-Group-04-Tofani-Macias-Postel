# SmartStudy — `unselected/` (gateway + microservices)

Same React UI as `selected/`, but the backend is split into **separate FastAPI processes** behind an **API gateway**. Each stateful service uses its own SQLite file. The browser only talks to the gateway on port **8000**; the gateway calls services over HTTP and passes `X-User-Id` after validating the JWT.

---

## Run locally — step-by-step (read this first)

**Repository root** = the folder that contains **`selected/`** and **`unselected/`** together. Replace `~/SmartStudy` below with your clone path (e.g. `/Users/camtofani/SmartStudy`).

### First time on this machine

**1. Install all Python dependencies (one venv for everything)**

```bash
cd ~/SmartStudy/unselected/backend
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

**2. Environment file (recommended)**

Still in `unselected/backend` with `.venv` activated:

```bash
cp .env.example .env
```

The gateway and auth service must use the same **`SECRET_KEY`** (the example file already sets one). The run script will **`source`** this file automatically when it exists.

**3. Start all backend processes (gateway + 6 services)**

You **must** have the same **`.venv` activated** so `uvicorn` is on your `PATH`.

**Option A — from repository root (recommended):**

```bash
cd ~/SmartStudy
source unselected/backend/.venv/bin/activate
chmod +x unselected/scripts/run-microservices.sh
./unselected/scripts/run-microservices.sh
```

**Option B — already sitting in `unselected/backend` with venv on:**

```bash
cd ~/SmartStudy/unselected/backend
source .venv/bin/activate
../scripts/run-microservices.sh
```

Leave this terminal open. Wait until you see Uvicorn on **8000** and no **“address already in use”** error.

**4. Smoke-test the gateway**

In another terminal:

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/routes
```

`/health` should mention **microservices** / gateway (not `"layered-monolith"`). If `/health` shows **layered-monolith**, something else (usually **`selected/`** backend) is still bound to **8000** — stop it and restart this script.

**5. Frontend (second terminal)**

```bash
cd ~/SmartStudy/unselected/frontend
npm install
npm start
```

**`npm install` is required the first time** (fixes `react-scripts: command not found`). Open the URL CRA prints (often **http://localhost:3000** or **3001**). CORS already allows **3000** and **3001**.

### Every later session

**Terminal 1 — backend:**

```bash
cd ~/SmartStudy
source unselected/backend/.venv/bin/activate
./unselected/scripts/run-microservices.sh
```

(or from `unselected/backend`: `source .venv/bin/activate` then `../scripts/run-microservices.sh`)

**Terminal 2 — frontend:**

```bash
cd ~/SmartStudy/unselected/frontend
npm start
```

### Important

- **Port 8000** must be free for the **gateway**. Stop the **`selected/`** backend before starting this stack.
- **Windows:** use `.venv\Scripts\activate` instead of `source .venv/bin/activate`.
- **Docker:** not used; venv + `pip` + the script are enough.

---

## Architecture (ports)

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

## Prerequisites (summary)

- Python **3.11+** and `pip`
- Node.js **18+** and `npm`

## Manual start (no script) — seven terminals

Only if you choose not to use `run-microservices.sh`. In **each** terminal, activate the **same** venv first, then `cd` into the service directory shown and run `uvicorn`:

```bash
# Example for auth — repeat pattern for each service + gateway
cd ~/SmartStudy/unselected/backend
source .venv/bin/activate
cd services/auth-service
uvicorn app.main:app --host 127.0.0.1 --port 8101
```

Ports: **8101** auth, **8102** study-plan, **8103** progress, **8104** group, **8105** notification, **8106** ai, **8000** gateway. For the gateway process, `cd` to **`~/SmartStudy/unselected/backend/gateway`** (or from any `services/<name>` folder: `cd ../../gateway`). Start **8101–8106** before **8000** so the gateway can reach them.

If you use manual starts, load **`SECRET_KEY`** in every shell, e.g. from `unselected/backend`: `set -a && source .env && set +a`.

## SQLite files

Stateful services create a SQLite file **inside that service’s directory** (e.g. `services/auth-service/auth_service.db`). Always start `uvicorn` from the correct service folder, or use the script so paths stay consistent.

## Compared to `selected/`

| | `selected/` | `unselected/` |
|--|-------------|----------------|
| UI | React (under `selected/frontend`) | React (under `unselected/frontend`) |
| API | One FastAPI app on **8000** | Gateway on **8000** |
| DB | One `smartstudy.db` | One SQLite file per service |

## Seven processes — why this is still “more moving parts” than layered

At runtime this design is still **seven separate Uvicorn processes** (six services + gateway), each with its own **failure mode**, **logs**, and **HTTP integration** to the next hop. We added **`run-microservices.sh`** so **local grading and demos feel closer to “one command”**—similar to starting a single backend in `selected/`—but that script is a **convenience**, not a change to the architecture:

- **Without the script**, the honest comparison is **seven terminals** (or a process manager) vs **one** `uvicorn` for the layered app.
- **With the script**, you still have **inter-service HTTP**, **service URLs / env**, **multiple SQLite files**, and **JWT consistency** between gateway and auth—more **operational and integration surface area** than one process and one database file.

So when we argue against microservices for *this* course project, the point is not only “more terminals,” but **distributed operation and integration complexity**, even when local startup is scripted.

## Seven processes, no Compose

We intentionally skipped Docker Compose so the project runs with **Python + pip** only. The script starts all Uvicorn processes for you.

## Odds and ends

- **Notifications:** not persisted; restart clears the buffer.
- **JWT:** only the gateway decodes the browser’s token; other services receive **`X-User-Id`** from the gateway. Auth and gateway still need the same **`SECRET_KEY`**.
- **Frontend:** CRA `proxy` targets **8000**; or set **`REACT_APP_API_URL`** if you serve the UI differently.

## If signup or login fails with HTTP 500

The auth service pins **bcrypt** to a version compatible with **passlib**. A full **`pip install`** from the first-time steps above applies it. If you upgraded packages and see **500** on signup, run from `unselected/backend` with venv on:

```bash
pip install -r services/auth-service/requirements.txt
```

Then restart all backend processes.

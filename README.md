# SmartStudy: AI-Powered Collaborative Study Planning System

**Final Project Group 4** · **Team Members:** Jocelin Macias Juarez, Cameron Tofani, Abby Postel

**Course:** CS5319 - Software Architecture & Design

## 1. Project Overview

SmartStudy is an AI-powered educational tool designed to help university students optimize their learning through adaptive scheduling, progress tracking, and group collaboration. The system analyzes course workloads and student performance data to suggest the most efficient study paths.

## 2. Using the application (brief walkthrough)

Use either **`selected/`** or **`unselected/`** with its backend running and the matching frontend (`npm start`). Both UIs behave the same at a high level.

1. **Create an account** or **sign in** on the login screen.
2. Set up **courses** (course setup / draft) as the app prompts—this feeds deadlines and workload context.
3. Open **Study Plan** (or the plan view) to see your schedule and tasks derived from those courses.
4. Go to **AI Recommendations** (or similar), **request suggestions**, and wait for them to finish loading (especially if using a live LLM with `OPENAI_API_KEY` configured).
5. **Accept** or apply the suggestions so they merge into your **study plan** and appear on the plan views.
6. Optionally explore **progress** logging, **study groups**, and related pages as implemented in the UI.

*(Exact labels depend on the React pages; configure `OPENAI_*` in the backend `.env` if you want real AI responses instead of falling back behavior.)*

## 3. Architecture folder structure

Per the project requirements, this repository contains two complete architectural implementations for comparison:

- **`/selected`**: **Layered modular architecture** (recommended)—**one** FastAPI deployable with explicit **presentation (API) → application services → persistence/models** separation. See terminology note below.
- **`/unselected`**: **Microservices**—API gateway plus independent FastAPI services, each with its own SQLite database file where stateful.

**Terminology:** In discussion, **“monolith”** sometimes means an **undifferentiated** codebase with **no internal structure**, which is often criticized as hard to scale or refactor. **`selected/`** is **not** that design: it is **layered and modular** inside **one process**. That yields **maintainable boundaries** (routes, services, repositories) while keeping **one deployment unit**—you can still **scale out** replicas or **extract** a layer into a separate service later. We use **“layered”** / **“layered modular”** to describe this style and avoid implying a single opaque ball of code.

## 4. Implementation platform

- **Frontend:** React (Create React App), **Node.js v18+**
- **Backend:** **Python 3.11+**, **FastAPI**, Uvicorn
- **Database:** **SQLite** (one database file for the layered `selected/` backend; one SQLite file per service in `unselected/`)
- **Platform configuration:** Ensure `node`, `npm`, and `python3` are on your system `PATH`. For the microservices version in this repo, services run as separate **Uvicorn** processes (optional helper script under `unselected/scripts/`). **Docker is not used** in this submission—there is no `docker-compose` file; see section 5 and `unselected/README.md` for the exact commands.

## 5. Setup & execution instructions

Use **copy-paste commands** with **your clone path** instead of `~/SmartStudy` if different. The **repository root** is the folder that contains both **`selected/`** and **`unselected/`**.

### A. Selected architecture (layered modular) — `selected/`

**Full step-by-step (first time + every session, port numbers, health check):** see **`selected/README.md`**.

**Short version — Terminal 1 (backend on port 8000):**

```bash
cd ~/SmartStudy/selected/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (frontend):**

```bash
cd ~/SmartStudy/selected/frontend
npm install
npm start
```

Do **not** run **`unselected/`** at the same time on port **8000** (stop this backend first).

### B. Unselected architecture (microservices) — `unselected/`

**Full step-by-step (venv, all `pip install`s, env file, script path from repo root, frontend, smoke tests):** see **`unselected/README.md`**.

**Short version — one-time install (from repo root, paths relative to root):**

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
cp .env.example .env
```

**Start all backend processes** (must use the **same** `.venv` so `uvicorn` is found — from **repository root**):

```bash
cd ~/SmartStudy
source unselected/backend/.venv/bin/activate
chmod +x unselected/scripts/run-microservices.sh
./unselected/scripts/run-microservices.sh
```

If `unselected/backend/.env` exists, the script **sources** it (shared **`SECRET_KEY`** for gateway + auth).

**Frontend:**

```bash
cd ~/SmartStudy/unselected/frontend
npm install
npm start
```

## 6. Architectural rationale & comparison

**Rationale for selecting the layered modular design (`/selected`):**

After implementing and comparing both candidate styles, Group 4 recommends this design for the SmartStudy platform based on the following architectural drivers:

- **Development velocity:** As a three-person team within a semester, a single codebase and unified data model reduced coordination overhead at service boundaries and supported faster feature iteration.
- **System performance for this workload:** AI recommendations and study-plan data are tightly coupled. In the layered design, related logic composes through in-process calls. In the microservices version, gateway and inter-service HTTP calls added latency that was noticeable for interactive flows.
- **Operational simplicity:** One primary backend process and one SQLite file for the demo scope simplified local runs, logging, and grading which is important for a student productivity app at this scale.
- **Refactorability:** Requirements evolved during development. Layers (routes → services → repositories) let us relocate logic without synchronizing multiple deployed API contracts, which the microservices tree would have required more often.
- **Maintainability:** Having a layered architecture means that we use one single database and one single schema. This means that evolving the model allows you to look in one place and only one transaction boundary. In microservices version, related data is split across several SQLite stores, which means that keeping them aligned is more overhead and is much more complex. Layered architecture also creates easier diagnosis and fewer partial features. A single process gives one log stream and with a semester to work on this, that ease in debuggability is great. 

**Comparison to microservices (`/unselected`):**

Microservices offer stronger horizontal scalability (scaling the AI service independently) and clearer fault isolation between processes. For SmartStudy’s current scale and team size, we judged the operational and integration complexity of distributed data and multiple runtimes to outweigh those benefits **for this submission**, while still demonstrating the alternative in `unselected/` for comparison. *Note:* `unselected/` includes a **single shell script** to start all services locally, which narrows the **day-to-day “how many terminals?”** gap for grading—but the design is still **seven processes**, inter-service HTTP, and multiple databases; see **`unselected/README.md`** for that distinction.

**GitHub repository link:** https://github.com/camerontofani/SmartStudy

**Final submission name:** CS5319 Final Project Group 4-Juarez-Tofani-Postel

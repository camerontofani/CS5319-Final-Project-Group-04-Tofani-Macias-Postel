# SmartStudy: AI-Powered Collaborative Study Planning System

**Final Project Group 4** · **Team Members:** Jocelin Macias Juarez, Cameron Tofani, Abby Postel

**Course:** CS5319 - Software Architecture & Design

## 1. Project Overview

SmartStudy is an AI-powered educational tool designed to help university students optimize their learning through adaptive scheduling, progress tracking, and group collaboration. The system analyzes course workloads and student performance data to suggest the most efficient study paths.

## 2. Architecture Folder Structure

Per the project requirements, this repository contains two complete architectural implementations for comparison:

- **`/selected`**: Layered monolithic architecture (recommended architecture choice)—one FastAPI application with clear internal layers (API, services, persistence).
- **`/unselected`**: Microservices architecture—API gateway plus independent FastAPI services, each with its own SQLite database file.

## 3. Implementation Platform

- **Frontend:** React (Create React App), **Node.js v18+**
- **Backend:** **Python 3.11+**, **FastAPI**, Uvicorn
- **Database:** **SQLite** (one database file for the layered `selected/` backend; one SQLite file per service in `unselected/`)
- **Platform configuration:** Ensure `node`, `npm`, and `python3` are on your system `PATH`. For the microservices version in this repo, services run as separate **Uvicorn** processes (optional helper script under `unselected/scripts/`). **Docker is not used** in this submission—there is no `docker-compose` file; see section 4B and `unselected/README.md` for the exact commands.

## 4. Setup & Execution Instructions

Use **copy-paste commands** with **your clone path** instead of `~/SmartStudy` if different. The **repository root** is the folder that contains both **`selected/`** and **`unselected/`**.

### A. Selected architecture (layered monolith) — `selected/`

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

## 5. Architectural Rationale & Comparison

**Rationale for selecting the layered monolith (`/selected`):**

After implementing and comparing both candidate styles, Group 4 recommends the layered monolith for the SmartStudy platform based on the following architectural drivers:

- **Development velocity:** As a three-person team within a semester, a single codebase and unified data model reduced coordination overhead at service boundaries and supported faster feature iteration.
- **System performance for this workload:** AI recommendations and study-plan data are tightly coupled. In the layered design, related logic composes through in-process calls. In the microservices version, gateway and inter-service HTTP calls added latency that was noticeable for interactive flows.
- **Operational simplicity:** One primary backend process and one SQLite file for the demo scope simplified local runs, logging, and grading—important for a student productivity app at this scale.
- **Refactorability:** Requirements evolved during development. Layers (routes → services → repositories) let us relocate logic without synchronizing multiple deployed API contracts, which the microservices tree would have required more often.

**Comparison to microservices (`/unselected`):**

Microservices offer stronger horizontal scalability (e.g., scaling the AI service independently) and clearer fault isolation between processes. For SmartStudy’s current scale and team size, we judged the operational and integration complexity of distributed data and multiple runtimes to outweigh those benefits **for this submission**, while still demonstrating the alternative in `unselected/` for comparison. *Note:* `unselected/` includes a **single shell script** to start all services locally, which narrows the **day-to-day “how many terminals?”** gap for grading—but the design is still **seven processes**, inter-service HTTP, and multiple databases; see **`unselected/README.md`** for that distinction.

**GitHub repository link:** https://github.com/camerontofani/SmartStudy

**Final submission name:** CS5319 Final Project Group 4-Juarez-Tofani-Postel

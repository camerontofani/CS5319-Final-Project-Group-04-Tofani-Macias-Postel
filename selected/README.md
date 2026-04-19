# Selected: Microservices

This version splits backend responsibilities across a gateway and separate FastAPI services.

## Simple structure

- `frontend/` - React UI copy
- `backend/gateway/` - API gateway app
- `backend/services/auth-service/`
- `backend/services/study-plan-service/`
- `backend/services/progress-service/`
- `backend/services/group-service/`
- `backend/services/notification-service/`
- `backend/services/ai-service/`

## Current milestone shell

- Milestone 1: gateway + auth service
- Milestone 2: study plan service
- Milestone 3: progress service
- Milestone 4: group service
- Milestone 5: AI service (+ optional notifications)
- Milestone 6: cross-service testing and evaluation

## Run (manual, one terminal per app)

Gateway (`8100`):

```bash
cd backend/gateway
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

Auth (`8101`):

```bash
cd backend/services/auth-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8101
```

Repeat the same for the other services with ports:
- study-plan `8102`
- progress `8103`
- group `8104`
- notification `8105`
- ai `8106`

Frontend:

```bash
cd frontend
npm install
npm start
```

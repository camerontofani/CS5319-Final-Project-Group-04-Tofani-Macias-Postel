# study groups, goals, milestones, member check-ins
from fastapi import FastAPI

app = FastAPI(title="Group Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "group-service"}


@app.post("/checkin")
def checkin(payload: dict):
    return {"message": "Group check-in placeholder (Milestone 4)", "payload": payload}

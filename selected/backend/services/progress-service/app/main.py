# progress tracking and analytics for dashboards
from fastapi import FastAPI

app = FastAPI(title="Progress Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "progress-service"}


@app.post("/log")
def log_progress(payload: dict):
    return {"message": "Progress logging placeholder (Milestone 3)", "payload": payload}

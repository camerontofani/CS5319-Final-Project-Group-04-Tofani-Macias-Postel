# study plan generation only; other features live in other services
from fastapi import FastAPI

app = FastAPI(title="Study Plan Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "study-plan-service"}


@app.post("/generate")
def generate_plan(payload: dict):
    return {
        "message": "Plan generation placeholder (Milestone 2)",
        "payload": payload,
    }

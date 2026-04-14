# study plan generation only; other features live in other services
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Study Plan Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "study-plan-service"}


@app.post("/generate")
def generate_plan(payload: dict):
    return {
        "message": "Plan generation placeholder (Milestone 2)",
        "payload": payload,
    }

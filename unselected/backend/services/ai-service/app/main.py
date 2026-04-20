from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Recommendations Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "recommendations-service"}


@app.post("/internal/recommend")
def recommend(payload: dict):
    topic = payload.get("topic", "your plan")
    return {
        "recommendation": f"Focus on {topic} in shorter sessions with breaks.",
        "reason": "Balances workload using your recent activity.",
    }

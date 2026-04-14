# ai recommendations in one deployable; gateway calls this over http
from fastapi import FastAPI

app = FastAPI(title="AI Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/recommend")
def recommend(payload: dict):
    topic = payload.get("topic", "General review")
    return {
        "message": "AI recommendation placeholder (Milestone 5)",
        "recommendation": f"Focus on {topic} in short blocks and review weak topics first.",
    }

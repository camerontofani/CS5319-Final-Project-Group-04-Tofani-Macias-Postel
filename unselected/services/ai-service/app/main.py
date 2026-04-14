# ai recommendations in one deployable; gateway calls this over http
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Service", version="0.1.0")
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
    return {"status": "ok", "service": "ai-service"}


@app.post("/recommend")
def recommend(payload: dict):
    topic = payload.get("topic", "General review")
    return {
        "message": "AI recommendation placeholder (Milestone 5)",
        "recommendation": f"Focus on {topic} in short blocks and review weak topics first.",
    }

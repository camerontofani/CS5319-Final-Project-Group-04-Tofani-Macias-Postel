# single entry url for the browser; later proxy requests to each service below
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartStudy API Gateway (Microservices)", version="0.1.0")
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
    return {"status": "ok", "architecture": "microservices-gateway"}


@app.get("/routes")
def routes():
    # dev-only map so frontend knows where each microservice runs locally
    return {
        "auth": "http://localhost:8101",
        "study_plan": "http://localhost:8102",
        "progress": "http://localhost:8103",
        "group": "http://localhost:8104",
        "notification": "http://localhost:8105",
        "ai": "http://localhost:8106",
    }

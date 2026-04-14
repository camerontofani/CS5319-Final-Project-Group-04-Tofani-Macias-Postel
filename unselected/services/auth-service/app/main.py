# runs alone on its own port; auth only (no shared imports with monolith)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Auth Service", version="0.1.0")
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
    return {"status": "ok", "service": "auth-service"}


@app.post("/signup")
def signup(payload: dict):
    # same idea as monolith signup but owned by this service only
    return {"message": "Signup placeholder (Milestone 1)", "payload": payload}

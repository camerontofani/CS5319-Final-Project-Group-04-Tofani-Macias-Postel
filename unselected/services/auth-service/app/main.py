# runs alone on its own port; auth only (no shared imports with monolith)
from fastapi import FastAPI

app = FastAPI(title="Auth Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth-service"}


@app.post("/signup")
def signup(payload: dict):
    # same idea as monolith signup but owned by this service only
    return {"message": "Signup placeholder (Milestone 1)", "payload": payload}

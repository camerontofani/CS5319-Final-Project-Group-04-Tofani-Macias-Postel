# entry point for the monolith: one process serves all api routes
from fastapi import FastAPI

from app.api.routes import api_router

app = FastAPI(title="SmartStudy API (Monolith)", version="0.1.0")
# mount all feature routes under /api (see api/routes.py)
app.include_router(api_router)


@app.get("/health")
def health():
    # simple check so deploy tools or teammates can verify the server is up
    return {"status": "ok", "architecture": "layered-monolith"}

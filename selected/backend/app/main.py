# entry point for the monolith: one process serves all api routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router

app = FastAPI(title="SmartStudy API (Monolith)", version="0.1.0")
# lets the vite dev server call this api from the browser
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
# mount all feature routes under /api (see api/routes.py)
app.include_router(api_router)


@app.get("/health")
def health():
    # simple check so deploy tools or teammates can verify the server is up
    return {"status": "ok", "architecture": "layered-monolith"}

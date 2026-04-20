"""notification service with in memory event list"""

from datetime import datetime, timezone
from threading import Lock

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Notification Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_events: list[dict] = []
_lock = Lock()
_MAX = 200


@app.get("/health")
def health():
    return {"status": "ok", "service": "notification-service", "buffered_events": len(_events)}


@app.post("/internal/notify")
def notify(payload: dict):
    """store one event from gateway"""
    entry = {
        "receivedAt": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    with _lock:
        _events.append(entry)
        if len(_events) > _MAX:
            del _events[: len(_events) - _MAX]
    return {"ok": True, "queued": True}


@app.get("/internal/events")
def list_events(limit: int = 50):
    with _lock:
        return {"events": _events[-limit:]}

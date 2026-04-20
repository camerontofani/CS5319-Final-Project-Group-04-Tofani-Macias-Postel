from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import Base, UserProgress, engine, get_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Progress Service", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def uid_dep(x_user_id: str | None = Header(None, alias="X-User-Id")) -> int:
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id required")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid X-User-Id")


def _ensure_row(db: Session, user_id: int) -> UserProgress:
    row = db.get(UserProgress, user_id)
    if row is None:
        row = UserProgress(user_id=user_id, progress_logs=[])
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@app.get("/health")
def health():
    return {"status": "ok", "service": "progress-service"}


@app.get("/internal/state")
def get_state(user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    logs = row.progress_logs if isinstance(row.progress_logs, list) else []
    return {"progressLogs": logs}


@app.patch("/internal/state")
def patch_state(body: dict, user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    if "progressLogs" in body:
        row.progress_logs = body["progressLogs"]
    db.commit()
    db.refresh(row)
    logs = row.progress_logs if isinstance(row.progress_logs, list) else []
    return {"progressLogs": logs}


@app.post("/internal/log")
def log_progress(payload: dict, user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    logs = list(row.progress_logs if isinstance(row.progress_logs, list) else [])
    entry = {
        **payload,
        "loggedAt": datetime.now(timezone.utc).isoformat(),
    }
    logs.append(entry)
    row.progress_logs = logs
    db.commit()
    db.refresh(row)
    return {"entry_saved": entry, "progressLogs": logs}

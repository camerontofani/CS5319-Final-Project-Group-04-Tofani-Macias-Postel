from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import Base, UserGroupState, engine, get_db
from app.defaults import default_group_slice, default_study_groups

ALLOWED = frozenset({"studyGroups", "groupData"})


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Group Service", version="0.1.0", lifespan=lifespan)
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


def _ensure_row(db: Session, user_id: int) -> UserGroupState:
    row = db.get(UserGroupState, user_id)
    if row is None:
        row = UserGroupState(user_id=user_id, state=default_group_slice(user_id))
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _merged(db: Session, user_id: int, row: UserGroupState) -> dict[str, Any]:
    base = default_group_slice(user_id)
    stored = row.state if isinstance(row.state, dict) else {}
    out = {**base, **stored}
    if not out.get("studyGroups"):
        out["studyGroups"] = default_study_groups(user_id)
        row.state = out
        db.commit()
        db.refresh(row)
    return out


@app.get("/health")
def health():
    return {"status": "ok", "service": "group-service"}


@app.get("/internal/state")
def get_state(user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    return _merged(db, user_id, row)


@app.patch("/internal/state")
def patch_state(body: dict, user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    current = _merged(db, user_id, row)
    for k, v in body.items():
        if k in ALLOWED:
            current[k] = v
    row.state = current
    db.commit()
    db.refresh(row)
    return current


@app.post("/internal/checkin")
def checkin(payload: dict, user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    group_id = payload.get("group_id")
    if not group_id:
        return {"checkin": payload, "error": "group_id required"}
    comment = str(payload.get("comment") or "").strip() or "(empty)"
    row = _ensure_row(db, user_id)
    current = _merged(db, user_id, row)
    gd = dict(current.get("groupData") or {})
    entry = gd.get(group_id) or {"weeklyGoal": "", "milestones": {}, "checkins": []}
    checkins = list(entry.get("checkins") or [])
    checkins.append({"comment": comment, "savedAt": datetime.now(timezone.utc).isoformat()})
    gd[group_id] = {**entry, "checkins": checkins}
    current["groupData"] = gd
    row.state = current
    db.commit()
    db.refresh(row)
    return {"checkin": payload, "groupSlice": _merged(db, user_id, row)}

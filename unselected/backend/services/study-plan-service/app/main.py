from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import Base, UserPlanState, default_plan_slice, engine, get_db
from app.plan_logic import create_study_plan

ALLOWED = frozenset({"plan", "courseSetupDraft", "deadlines", "completedTaskKeys"})


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Study Plan Service", version="0.1.0", lifespan=lifespan)
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


def _ensure_row(db: Session, user_id: int) -> UserPlanState:
    row = db.get(UserPlanState, user_id)
    if row is None:
        row = UserPlanState(user_id=user_id, state=default_plan_slice())
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _merged(db: Session, user_id: int, row: UserPlanState) -> dict[str, Any]:
    base = default_plan_slice()
    stored = row.state if isinstance(row.state, dict) else {}
    return {**base, **stored}


@app.get("/health")
def health():
    return {"status": "ok", "service": "study-plan-service"}


@app.get("/internal/state")
def get_state(user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    row = _ensure_row(db, user_id)
    return _merged(db, user_id, row)


@app.patch("/internal/state")
def patch_state(
    body: dict,
    user_id: int = Depends(uid_dep),
    db: Session = Depends(get_db),
):
    row = _ensure_row(db, user_id)
    current = _merged(db, user_id, row)
    for k, v in body.items():
        if k in ALLOWED:
            current[k] = v
    row.state = current
    db.commit()
    db.refresh(row)
    return current


@app.post("/internal/plans/generate")
def generate_plan(payload: dict, user_id: int = Depends(uid_dep), db: Session = Depends(get_db)):
    plan_dict = create_study_plan(payload)
    row = _ensure_row(db, user_id)
    current = _merged(db, user_id, row)
    current["plan"] = plan_dict
    current["courseSetupDraft"] = None
    row.state = current
    db.commit()
    db.refresh(row)
    return {"plan": plan_dict, "slice": _merged(db, user_id, row)}

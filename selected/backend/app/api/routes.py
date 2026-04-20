from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_routes import router as auth_router
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.ai_service import get_ai_recommendation
from app.services.group_service import create_group_checkin
from app.services.plan_service import create_study_plan
from app.services.progress_service import log_study_progress
from app.services.user_state_service import get_merged_state, patch_state, set_plan_and_clear_draft

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)


@api_router.get("/user-state")
def get_user_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Full app snapshot for the client (replaces localStorage)."""
    return get_merged_state(db, user.id)


@api_router.patch("/user-state")
def patch_user_state(body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return patch_state(db, user.id, body)


@api_router.post("/plans/generate")
def plans_generate(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan_dict = create_study_plan(payload)
    set_plan_and_clear_draft(db, user.id, plan_dict)
    # One round trip: client syncs from userState without a separate GET.
    return {"plan": plan_dict, "userState": get_merged_state(db, user.id)}


@api_router.post("/progress/log")
def progress_log(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return log_study_progress(db, user.id, payload)


@api_router.post("/groups/checkin")
def groups_checkin(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_group_checkin(db, user.id, payload)


@api_router.post("/ai/recommend")
def ai_recommend(payload: dict, _user: User = Depends(get_current_user)):
    return get_ai_recommendation(payload)

from fastapi import APIRouter, Depends

from app.api.auth_routes import router as auth_router
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import get_ai_recommendation
from app.services.group_service import create_group_checkin
from app.services.plan_service import create_study_plan
from app.services.progress_service import log_study_progress

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)


@api_router.post("/plans/generate")
def plans_generate(payload: dict, _user: User = Depends(get_current_user)):
    return create_study_plan(payload)


@api_router.post("/progress/log")
def progress_log(payload: dict, _user: User = Depends(get_current_user)):
    return log_study_progress(payload)


@api_router.post("/groups/checkin")
def groups_checkin(payload: dict, _user: User = Depends(get_current_user)):
    return create_group_checkin(payload)


@api_router.post("/ai/recommend")
def ai_recommend(payload: dict, _user: User = Depends(get_current_user)):
    return get_ai_recommendation(payload)

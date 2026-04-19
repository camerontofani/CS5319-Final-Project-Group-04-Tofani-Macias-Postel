# http layer: maps urls to service functions (business logic lives in services/)
from fastapi import APIRouter

from app.services.ai_service import get_ai_recommendation
from app.services.auth_service import signup_user
from app.services.group_service import create_group_checkin
from app.services.plan_service import create_study_plan
from app.services.progress_service import log_study_progress

api_router = APIRouter(prefix="/api")


@api_router.post("/auth/signup")
def auth_signup(payload: dict):
    # body is json from the signup form (email, password, etc.)
    return signup_user(payload)


@api_router.post("/plans/generate")
def plans_generate(payload: dict):
    # courses, availability, preferences from onboarding
    return create_study_plan(payload)


@api_router.post("/progress/log")
def progress_log(payload: dict):
    # time studied, confidence, task completion, etc.
    return log_study_progress(payload)


@api_router.post("/groups/checkin")
def groups_checkin(payload: dict):
    # weekly goal text and done/not done for a group
    return create_group_checkin(payload)


@api_router.post("/ai/recommend")
def ai_recommend(payload: dict):
    # topic and signals; later this will call the llm integration layer
    return get_ai_recommendation(payload)

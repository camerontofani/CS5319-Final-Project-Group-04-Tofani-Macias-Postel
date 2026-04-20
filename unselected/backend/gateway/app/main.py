"""API Gateway: single browser entrypoint; fans out to microservices over HTTP."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import decode_token, get_settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(timeout=60.0) as client:
        app.state.http = client
        yield


app = FastAPI(title="SmartStudy API Gateway (Microservices)", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


PLAN_KEYS = frozenset({"plan", "courseSetupDraft", "deadlines", "completedTaskKeys"})
PROGRESS_KEYS = frozenset({"progressLogs"})
GROUP_KEYS = frozenset({"studyGroups", "groupData"})


def get_user_id(creds: HTTPAuthorizationCredentials = Depends(security)) -> int:
    payload = decode_token(creds.credentials)
    if not payload or "uid" not in payload:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    return int(payload["uid"])


def internal_headers(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


async def aggregate_user_state(client: httpx.AsyncClient, user_id: int) -> dict:
    settings = get_settings()
    h = internal_headers(user_id)
    pr, prog, grp, prof = await asyncio.gather(
        client.get(f"{settings.study_plan_service_url}/internal/state", headers=h),
        client.get(f"{settings.progress_service_url}/internal/state", headers=h),
        client.get(f"{settings.group_service_url}/internal/state", headers=h),
        client.get(f"{settings.auth_service_url}/internal/profile", headers=h),
    )
    for r in (pr, prog, grp, prof):
        r.raise_for_status()
    plan_j = pr.json()
    prog_j = prog.json()
    grp_j = grp.json()
    prof_j = prof.json()
    profile = prof_j.get("profile") if isinstance(prof_j, dict) else {}
    if not isinstance(profile, dict):
        profile = {}
    return {
        **plan_j,
        **prog_j,
        **grp_j,
        "profile": profile,
    }


@app.get("/health")
def health():
    return {"status": "ok", "architecture": "microservices-gateway"}


@app.get("/routes")
def routes():
    s = get_settings()
    return {
        "auth": s.auth_service_url,
        "study_plan": s.study_plan_service_url,
        "progress": s.progress_service_url,
        "group": s.group_service_url,
        "notification": s.notification_service_url,
        "ai": s.ai_service_url,
    }


async def _forward_auth_header(request: Request) -> dict[str, str]:
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="missing Authorization")
    return {"Authorization": auth}


# --- Auth (public) ---
@app.post("/api/auth/signup")
async def auth_signup(request: Request):
    body = await request.json()
    settings = get_settings()
    r = await app.state.http.post(f"{settings.auth_service_url}/signup", json=body)
    if r.status_code >= 400:
        detail = r.json().get("detail", r.text) if r.headers.get("content-type", "").startswith("application/json") else r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    return r.json()


@app.post("/api/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    settings = get_settings()
    r = await app.state.http.post(f"{settings.auth_service_url}/login", json=body)
    if r.status_code >= 400:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    return r.json()


@app.get("/api/auth/me")
async def auth_me(request: Request):
    headers = await _forward_auth_header(request)
    settings = get_settings()
    r = await app.state.http.get(f"{settings.auth_service_url}/me", headers=headers)
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


@app.get("/api/user-state")
async def get_user_state(user_id: Annotated[int, Depends(get_user_id)]):
    client: httpx.AsyncClient = app.state.http
    return await aggregate_user_state(client, user_id)


@app.patch("/api/user-state")
async def patch_user_state(request: Request, user_id: Annotated[int, Depends(get_user_id)]):
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="expected JSON object")
    settings = get_settings()
    client: httpx.AsyncClient = app.state.http
    h = internal_headers(user_id)

    plan_partial = {k: v for k, v in body.items() if k in PLAN_KEYS}
    if plan_partial:
        r = await client.patch(f"{settings.study_plan_service_url}/internal/state", json=plan_partial, headers=h)
        r.raise_for_status()

    prog_partial = {k: v for k, v in body.items() if k in PROGRESS_KEYS}
    if prog_partial:
        r = await client.patch(f"{settings.progress_service_url}/internal/state", json=prog_partial, headers=h)
        r.raise_for_status()

    grp_partial = {k: v for k, v in body.items() if k in GROUP_KEYS}
    if grp_partial:
        r = await client.patch(f"{settings.group_service_url}/internal/state", json=grp_partial, headers=h)
        r.raise_for_status()

    if "profile" in body and isinstance(body["profile"], dict):
        r = await client.patch(
            f"{settings.auth_service_url}/internal/profile",
            json=body["profile"],
            headers=h,
        )
        r.raise_for_status()

    return await aggregate_user_state(client, user_id)


@app.post("/api/plans/generate")
async def plans_generate(request: Request, user_id: Annotated[int, Depends(get_user_id)]):
    payload = await request.json()
    settings = get_settings()
    client: httpx.AsyncClient = app.state.http
    h = internal_headers(user_id)
    r = await client.post(
        f"{settings.study_plan_service_url}/internal/plans/generate",
        json=payload,
        headers=h,
    )
    r.raise_for_status()
    data = r.json()
    plan_dict = data.get("plan")
    user_state = await aggregate_user_state(client, user_id)
    return {"plan": plan_dict, "userState": user_state}


@app.post("/api/progress/log")
async def progress_log(request: Request, user_id: Annotated[int, Depends(get_user_id)]):
    payload = await request.json()
    settings = get_settings()
    client: httpx.AsyncClient = app.state.http
    h = internal_headers(user_id)
    r = await client.post(f"{settings.progress_service_url}/internal/log", json=payload, headers=h)
    r.raise_for_status()
    return r.json()


@app.post("/api/groups/checkin")
async def groups_checkin(request: Request, user_id: Annotated[int, Depends(get_user_id)]):
    payload = await request.json()
    settings = get_settings()
    client: httpx.AsyncClient = app.state.http
    h = internal_headers(user_id)
    r = await client.post(f"{settings.group_service_url}/internal/checkin", json=payload, headers=h)
    r.raise_for_status()
    _ = r.json()
    user_state = await aggregate_user_state(client, user_id)
    try:
        await client.post(
            f"{settings.notification_service_url}/internal/notify",
            json={"type": "group_checkin", "user_id": user_id, "payload": payload},
            timeout=5.0,
        )
    except Exception as e:
        logger.debug("notification fan-out skipped: %s", e)
    return {"checkin": payload, "userState": user_state}


@app.post("/api/ai/recommend")
async def ai_recommend(request: Request, user_id: Annotated[int, Depends(get_user_id)]):
    _ = user_id
    payload = await request.json()
    settings = get_settings()
    client: httpx.AsyncClient = app.state.http
    r = await client.post(f"{settings.ai_service_url}/internal/recommend", json=payload)
    r.raise_for_status()
    return r.json()

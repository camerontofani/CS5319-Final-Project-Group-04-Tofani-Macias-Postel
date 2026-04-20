from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core import create_access_token, decode_token, get_settings, hash_password, verify_password
from app.db import Base, User, engine, get_db
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserOut

security = HTTPBearer()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Auth Service", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(creds.credentials)
    if not payload or "uid" not in payload:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    user = db.get(User, int(payload["uid"]))
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    return user


def user_out(u: User) -> UserOut:
    prof = u.profile if isinstance(u.profile, dict) else {}
    return UserOut(id=u.id, email=u.email, profile=prof)


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth-service"}


@app.post("/signup", response_model=TokenResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password), profile={})
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=user.email, user_id=user.id)
    return TokenResponse(access_token=token, user=user_out(user))


@app.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="invalid email or password")
    token = create_access_token(subject=user.email, user_id=user.id)
    return TokenResponse(access_token=token, user=user_out(user))


@app.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_out(user)


# Internal (gateway only — localhost / trusted network in demo)
def _user_from_internal_header(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id required")
    try:
        uid = int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid X-User-Id")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    return user


@app.get("/internal/profile")
def internal_get_profile(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user = _user_from_internal_header(x_user_id, db)
    return {"profile": user.profile if isinstance(user.profile, dict) else {}}


@app.patch("/internal/profile")
def internal_patch_profile(
    body: dict,
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user = _user_from_internal_header(x_user_id, db)
    cur = user.profile if isinstance(user.profile, dict) else {}
    merged = {**cur, **body}
    user.profile = merged
    db.commit()
    db.refresh(user)
    return {"profile": merged}

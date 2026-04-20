from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import create_user, get_user_by_email
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserOut


def signup_user(db: Session, body: SignupRequest) -> TokenResponse:
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="email already registered")
    user = create_user(db, body.email, hash_password(body.password))
    token = create_access_token(subject=user.email, user_id=user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


def login_user(db: Session, body: LoginRequest) -> TokenResponse:
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="invalid email or password")
    token = create_access_token(subject=user.email, user_id=user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )

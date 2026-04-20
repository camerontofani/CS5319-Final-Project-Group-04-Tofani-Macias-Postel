from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer()


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

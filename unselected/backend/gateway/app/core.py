from functools import lru_cache

from jose import JWTError, jwt
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"

    auth_service_url: str = "http://127.0.0.1:8101"
    study_plan_service_url: str = "http://127.0.0.1:8102"
    progress_service_url: str = "http://127.0.0.1:8103"
    group_service_url: str = "http://127.0.0.1:8104"
    notification_service_url: str = "http://127.0.0.1:8105"
    ai_service_url: str = "http://127.0.0.1:8106"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def decode_token(token: str) -> dict | None:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None

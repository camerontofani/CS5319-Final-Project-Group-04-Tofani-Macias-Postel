from collections.abc import Generator
from typing import Any

from sqlalchemy import JSON, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = "sqlite:///./study_plan_service.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UserPlanState(Base):
    __tablename__ = "user_plan_states"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


def default_plan_slice() -> dict[str, Any]:
    return {
        "plan": None,
        "courseSetupDraft": None,
        "deadlines": [],
        "completedTaskKeys": [],
    }


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

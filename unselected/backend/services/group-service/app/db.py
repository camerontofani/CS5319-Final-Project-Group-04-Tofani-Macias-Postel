from collections.abc import Generator
from typing import Any

from sqlalchemy import JSON, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = "sqlite:///./group_service.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UserGroupState(Base):
    __tablename__ = "user_group_states"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

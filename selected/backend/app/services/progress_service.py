from sqlalchemy.orm import Session

from app.services.user_state_service import append_progress_log


def log_study_progress(db: Session, user_id: int, payload: dict) -> dict:
    entry_saved, progress_logs = append_progress_log(db, user_id, payload)
    return {"entry_saved": entry_saved, "progressLogs": progress_logs}

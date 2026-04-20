from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.services.user_state_service import get_merged_state, patch_state


def create_group_checkin(db: Session, user_id: int, payload: dict) -> dict:
    """Append check-in into persisted groupData (same shape the UI uses)."""
    group_id = payload.get("group_id")
    if not group_id:
        return {"checkin": payload, "error": "group_id required"}

    comment = str(payload.get("comment") or "").strip() or "(empty)"
    state = get_merged_state(db, user_id)
    gd = dict(state.get("groupData") or {})
    entry = gd.get(group_id) or {"weeklyGoal": "", "milestones": {}, "checkins": []}
    checkins = list(entry.get("checkins") or [])
    checkins.append({"comment": comment, "savedAt": datetime.now(timezone.utc).isoformat()})
    gd[group_id] = {**entry, "checkins": checkins}
    patch_state(db, user_id, {"groupData": gd})
    return {"checkin": payload, "userState": get_merged_state(db, user_id)}

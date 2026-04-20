"""load and merge per user app state"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.user_app_state import UserAppState

ALLOWED_TOP_LEVEL_KEYS = frozenset(
    {
        "plan",
        "courseSetupDraft",
        "progressLogs",
        "deadlines",
        "studyGroups",
        "profile",
        "completedTaskKeys",
        "groupData",
    }
)


def default_study_groups(uid: int) -> list[dict[str, Any]]:
    """default study groups"""
    return [
        {
            "id": f"{uid}-g1",
            "name": "CS301 Algo Squad",
            "shortName": "CS301",
            "memberCount": 4,
            "milestonePct": 60,
            "description": "Cracking algorithms together before finals",
            "nextMeeting": "Thu, Mar 5 · 7pm",
            "members": [
                {
                    "id": "m1",
                    "name": "You",
                    "role": "You",
                    "goal": "Finish DP chapter + 5 practice problems",
                    "progress": "2/5",
                    "status": "checked_in",
                },
                {
                    "id": "m2",
                    "name": "Maya Patel",
                    "goal": "Review binary tree problems",
                    "progress": "3/3",
                    "status": "checked_in",
                },
                {"id": "m3", "name": "Jake Lee", "goal": "Goal not shared", "progress": "", "status": "pending"},
                {
                    "id": "m4",
                    "name": "Sofia Chen",
                    "role": "Organizer",
                    "goal": "Graph traversal + BFS/DFS",
                    "progress": "1/4",
                    "status": "checked_in",
                },
            ],
        },
        {
            "id": f"{uid}-g2",
            "name": "OS Study Circle",
            "shortName": "OS",
            "memberCount": 2,
            "milestonePct": 40,
            "description": "Operating systems deep dives",
            "nextMeeting": "Wed, Mar 4 · 6pm",
            "members": [
                {
                    "id": "o1",
                    "name": "You",
                    "role": "You",
                    "goal": "Read paging chapter",
                    "progress": "1/2",
                    "status": "checked_in",
                },
                {"id": "o2", "name": "Sam Rivera", "goal": "Scheduling problems", "progress": "0/3", "status": "pending"},
            ],
        },
        {
            "id": f"{uid}-g3",
            "name": "Database Design",
            "shortName": "DB",
            "memberCount": 2,
            "milestonePct": 75,
            "description": "Normalization and SQL",
            "nextMeeting": "Sat, Mar 7 · 10am",
            "members": [
                {
                    "id": "d1",
                    "name": "You",
                    "role": "You",
                    "goal": "Transactions & ACID quiz",
                    "progress": "2/4",
                    "status": "checked_in",
                },
                {"id": "d2", "name": "Priya N.", "goal": "ER diagrams", "progress": "1/1", "status": "checked_in"},
            ],
        },
    ]


def default_state(uid: int) -> dict[str, Any]:
    return {
        "plan": None,
        "courseSetupDraft": None,
        "progressLogs": [],
        "deadlines": [],
        "studyGroups": default_study_groups(uid),
        "profile": {"displayName": "", "major": "", "year": ""},
        "completedTaskKeys": [],
        "groupData": {},
    }


def _ensure_row(db: Session, user_id: int) -> UserAppState:
    row = db.get(UserAppState, user_id)
    if row is None:
        row = UserAppState(user_id=user_id, state=default_state(user_id))
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _merged_state_dict(db: Session, user_id: int, row: UserAppState) -> dict[str, Any]:
    """merge defaults with stored state from one row"""
    base = default_state(user_id)
    stored = row.state if isinstance(row.state, dict) else {}
    out = {**base, **stored}
    if not out.get("studyGroups"):
        out["studyGroups"] = default_study_groups(user_id)
        row.state = out
        db.commit()
        db.refresh(row)
    return out


def get_merged_state(db: Session, user_id: int) -> dict[str, Any]:
    """return full state with defaults for missing keys"""
    row = _ensure_row(db, user_id)
    return _merged_state_dict(db, user_id, row)


def patch_state(db: Session, user_id: int, partial: dict[str, Any]) -> dict[str, Any]:
    """merge allowed top level keys into stored state"""
    row = _ensure_row(db, user_id)
    current = _merged_state_dict(db, user_id, row)
    for k, v in partial.items():
        if k in ALLOWED_TOP_LEVEL_KEYS:
            current[k] = v
    row.state = current
    db.commit()
    db.refresh(row)
    return current


def set_plan_and_clear_draft(db: Session, user_id: int, plan: dict[str, Any]) -> None:
    patch_state(db, user_id, {"plan": plan, "courseSetupDraft": None})


def append_progress_log(db: Session, user_id: int, payload: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """append one log entry and save loggedAt"""
    current = get_merged_state(db, user_id)
    logs = list(current.get("progressLogs") or [])
    entry = {
        **payload,
        "loggedAt": datetime.now(timezone.utc).isoformat(),
    }
    logs.append(entry)
    patch_state(db, user_id, {"progressLogs": logs})
    return entry, logs

# Study plan from courses, hourly availability, preferences, and deadlines.
from datetime import date, datetime
from typing import List, Optional, Tuple


def _chunks_from_hours(hours: List[int]) -> List[Tuple[int, int]]:
    if not hours:
        return []
    hours = sorted(set(hours))
    chunks: List[Tuple[int, int]] = []
    start = hours[0]
    prev = hours[0]
    for h in hours[1:]:
        if h == prev + 1:
            prev = h
        else:
            chunks.append((start, prev))
            start = h
            prev = h
    chunks.append((start, prev))
    return chunks[:3]


def _norm(text: str) -> str:
    return "".join(ch for ch in (text or "").lower() if ch.isalnum())


def _days_until(when: str) -> Optional[int]:
    if not when:
        return None
    try:
        d = datetime.fromisoformat(str(when).replace("Z", "+00:00")).date()
    except Exception:
        try:
            d = date.fromisoformat(str(when))
        except Exception:
            return None
    return (d - date.today()).days


def _course_deadline_days(deadlines: list[dict], course_name: str, course_code: str) -> Optional[int]:
    name_n = _norm(course_name)
    code_n = _norm(course_code)
    best: Optional[int] = None
    for d in deadlines or []:
        due = _days_until(str(d.get("date") or ""))
        if due is None or due < 0:
            continue
        d_code = _norm(str(d.get("courseCode") or ""))
        d_title = _norm(str(d.get("title") or ""))
        match = False
        if code_n and d_code and (code_n in d_code or d_code in code_n):
            match = True
        if not match and name_n and d_title and (name_n in d_title or d_title in name_n):
            match = True
        if match and (best is None or due < best):
            best = due
    return best


def create_study_plan(payload: dict, deadlines: Optional[list[dict]] = None) -> dict:
    courses = payload.get("courses") or []
    availability = payload.get("availability") or []
    preferences = payload.get("preferences") or {}

    names = [str(c.get("name", "")).strip() for c in courses if c.get("name")]
    courses_label = ", ".join(names) if names else "Your courses"
    session_len = int(preferences.get("sessionLengthMinutes") or 45)
    daily_goal_h = float(preferences.get("dailyGoalHours") or 3)

    if not names:
        names = ["Course"]

    slot_blocks: List[Tuple[str, int, int]] = []
    for row in availability:
        day = row.get("day") or ""
        hours = sorted(set(row.get("hours") or []))
        if not hours:
            continue
        for start_h, end_h in _chunks_from_hours(hours):
            slot_blocks.append((day, start_h, end_h))

    sample_tasks: List[dict] = []
    for i, (day, start_h, end_h) in enumerate(slot_blocks):
        course_name = names[i % len(names)]
        code = course_name.split()[0][:6] if course_name else "CLASS"
        start_time = f"{start_h:02d}:00"
        end_time = f"{min(end_h + 1, 22):02d}:00"
        span_hours = max(1, end_h - start_h + 1)
        available_mins = span_hours * 60
        mins = max(30, min(session_len, available_mins))
        priority = "high" if i % 3 == 0 else "medium"
        days_to_due = _course_deadline_days(deadlines or [], course_name, code)
        if days_to_due is not None and days_to_due <= 7:
            priority = "high"
        sample_tasks.append(
            {
                "day": day,
                "startTime": start_time,
                "endTime": end_time,
                "courseCode": code,
                "courseName": course_name,
                "task": f"Study session — {course_name}",
                "minutes": int(mins),
                "priority": priority,
            }
        )

    if not sample_tasks and names:
        sample_tasks.append(
            {
                "day": "—",
                "startTime": "—",
                "endTime": "—",
                "courseCode": names[0].split()[0][:6] if names else "—",
                "courseName": names[0],
                "task": f"Set availability to schedule {courses_label}",
                "minutes": int(session_len),
                "priority": "medium",
            }
        )

    return {
        "input_received": {
            "courses": courses,
            "availability": availability,
            "preferences": preferences,
        },
        "sample_tasks": sample_tasks,
        "meta": {
            "dailyGoalHours": daily_goal_h,
            "sessionLengthMinutes": session_len,
        },
    }

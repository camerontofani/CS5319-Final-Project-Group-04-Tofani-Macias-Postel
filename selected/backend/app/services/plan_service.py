# Study plan from courses, hourly availability, and preferences.
from typing import List, Tuple


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


def create_study_plan(payload: dict) -> dict:
    courses = payload.get("courses") or []
    availability = payload.get("availability") or []
    preferences = payload.get("preferences") or {}

    names = [str(c.get("name", "")).strip() for c in courses if c.get("name")]
    courses_label = ", ".join(names) if names else "Your courses"
    session_len = int(preferences.get("sessionLengthMinutes") or 45)
    daily_goal_h = float(preferences.get("dailyGoalHours") or 3)

    if not names:
        names = ["Course"]

    # Collect every contiguous free block (day + hour range) across the week, then
    # round-robin assign courses so every class appears across the schedule.
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
        mins = min(max(30, span_hours * 60), session_len * 2)
        sample_tasks.append(
            {
                "day": day,
                "startTime": start_time,
                "endTime": end_time,
                "courseCode": code,
                "courseName": course_name,
                "task": f"Study session — {course_name}",
                "minutes": int(mins),
                "priority": "high" if i % 3 == 0 else "medium",
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

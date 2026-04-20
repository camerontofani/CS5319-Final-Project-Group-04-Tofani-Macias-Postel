def get_ai_recommendation(payload: dict, state: dict) -> dict:
    topic = payload.get("topic", "general studies")

    plan = state.get("plan") or {}
    raw_courses = (plan.get("input_received") or {}).get("courses") or []
    courses = [c.get("name", "") for c in raw_courses if c.get("name")]
    courses_str = ", ".join(courses) if courses else topic

    progress_logs = state.get("progressLogs") or []
    recent = progress_logs[-5:]
    recent_str = "\n".join(
        f"- {l.get('topic', '?')} ({l.get('minutes', 0)} min, confidence: {l.get('confidence', '?')})"
        for l in recent
    ) or "No recent sessions logged."

    deadlines = state.get("deadlines") or []
    upcoming = sorted(deadlines, key=lambda d: d.get("date", ""))[:3]
    deadlines_str = "\n".join(
        f"- {d.get('title', '?')} ({d.get('courseCode', '')}) due {d.get('date', '?')}"
        for d in upcoming
    ) or "No deadlines set."

    recommendation = (
        f"Prioritize {courses_str}: do a focused 45-minute block on your weakest topic, "
        "then spend 10 minutes reviewing errors and writing one summary takeaway."
    )

    return {
        "recommendation": recommendation,
        "reason": f"Based on your recent activity across {courses_str}.",
    }

import json
from datetime import timedelta
from datetime import date, datetime
from typing import Any

from app.core.config import get_settings


def _fallback_recommendation(payload: dict, state: dict, reason_suffix: str = "") -> dict:
    topic = payload.get("topic", "general studies")

    plan = state.get("plan") or {}
    raw_courses = (plan.get("input_received") or {}).get("courses") or []
    courses = [c.get("name", "") for c in raw_courses if c.get("name")]
    courses_str = ", ".join(courses) if courses else topic

    preferences = (plan.get("input_received") or {}).get("preferences") or {}
    styles = preferences.get("learningStyles") or []
    style_label = ", ".join([str(s) for s in styles[:2]]) if styles else "your preferred style"
    recommendation = (
        f"Prioritize {courses_str}: schedule a focused 45-minute block on your weakest topic, then do a 10-minute "
        f"{style_label.lower()} review (flashcards, summary, or quick teach-back) before ending."
    )
    recommendations = [
        {
            "day": "Next available day",
            "startTime": "next-open-slot",
            "endTime": "next-open-slot",
            "courseName": courses[0] if courses else topic,
            "task": "Focused review on weakest topic + active recall",
            "minutes": 45,
            "priority": "high",
        }
    ]
    suffix = f" {reason_suffix.strip()}" if reason_suffix else ""
    return {
        "recommendation": recommendation,
        "reason": f"Based on your recent activity across {courses_str}.{suffix}",
        "source": "fallback",
        "recommendations": recommendations,
    }


def _build_ai_context(payload: dict, state: dict) -> dict[str, Any]:
    plan = state.get("plan") or {}
    plan_input = plan.get("input_received") or {}
    progress_logs = state.get("progressLogs") or []
    deadlines = state.get("deadlines") or []
    topic = payload.get("topic", "general studies")
    return {
        "topic": topic,
        "courses": plan_input.get("courses") or [],
        "availability": plan_input.get("availability") or [],
        "preferences": plan_input.get("preferences") or {},
        "deadlines": deadlines[:10],
        "recent_progress": progress_logs[-8:],
        "sample_tasks": (plan.get("sample_tasks") or [])[:10],
    }


def _days_until(iso_value: str) -> int | None:
    try:
        due = datetime.fromisoformat(str(iso_value).replace("Z", "+00:00")).date()
    except Exception:
        try:
            due = date.fromisoformat(str(iso_value))
        except Exception:
            return None
    return (due - date.today()).days


def _exam_signal(context: dict[str, Any]) -> str:
    urgent = []
    for d in context.get("deadlines") or []:
        title = str(d.get("title") or "").lower()
        if "exam" not in title and "midterm" not in title and "final" not in title and "quiz" not in title:
            continue
        days = _days_until(str(d.get("date") or ""))
        if days is not None and 0 <= days <= 10:
            urgent.append((days, str(d.get("title") or "Exam")))
    if not urgent:
        return "No exam in the next 10 days."
    urgent.sort(key=lambda x: x[0])
    days, title = urgent[0]
    return f"Closest exam: {title} in {days} day(s). Increase priority and review cadence."


def _urgent_deadline(context: dict[str, Any]) -> dict[str, Any] | None:
    best = None
    for d in context.get("deadlines") or []:
        due_days = _days_until(str(d.get("date") or ""))
        if due_days is None or due_days < 0 or due_days > 7:
            continue
        title = str(d.get("title") or "deadline").strip()
        if not best or due_days < best["days"]:
            best = {
                "days": due_days,
                "title": title,
                "date": str(d.get("date") or ""),
                "courseName": str(d.get("courseCode") or "") or str((context.get("courses") or [{}])[0].get("name") or ""),
            }
    return best


def _deadline_action_text(title: str, days: int) -> str:
    t = (title or "").lower()
    when = "today" if days <= 0 else "tomorrow" if days == 1 else f"in {days}d"
    if any(k in t for k in ("exam", "midterm", "final", "quiz")):
        return f"Study for exam ({when})"
    if any(k in t for k in ("hw", "homework", "assignment", "problem set", "pset")):
        return f"Complete homework ({when})"
    return f"Prepare for {title} ({when})"


def _ensure_balanced_recommendations(
    context: dict[str, Any], recommendations: list[dict[str, Any]], urgent: dict[str, Any] | None
) -> list[dict[str, Any]]:
    def _day_to_idx(day_label: str) -> int | None:
        d = (day_label or "").strip().lower()[:3]
        mapping = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}
        return mapping.get(d)

    def _is_day_before_due(session_day: str, due_iso: str) -> bool:
        sidx = _day_to_idx(session_day)
        if sidx is None:
            return False
        try:
            due = datetime.fromisoformat(str(due_iso).replace("Z", "+00:00")).date()
        except Exception:
            try:
                due = date.fromisoformat(str(due_iso))
            except Exception:
                return False
        return sidx == ((due.weekday() + 1) % 7 + 6) % 7

    def _norm(value: str) -> str:
        return "".join(ch for ch in str(value or "").lower() if ch.isalnum())

    def _parse_hour(time_value: str) -> int | None:
        try:
            hh = int(str(time_value or "").split(":")[0])
            return hh
        except Exception:
            return None

    availability_rows = context.get("availability") or []
    avail_map: dict[str, set[int]] = {}
    for row in availability_rows:
        day = str((row or {}).get("day") or "")
        hours = {int(h) for h in ((row or {}).get("hours") or []) if isinstance(h, int)}
        if day and hours:
            avail_map[day] = hours

    def _slot_blocks() -> list[tuple[str, int, int]]:
        out_blocks: list[tuple[str, int, int]] = []
        for day, hours_set in avail_map.items():
            hours = sorted(hours_set)
            if not hours:
                continue
            start = prev = hours[0]
            for h in hours[1:]:
                if h == prev + 1:
                    prev = h
                else:
                    out_blocks.append((day, start, prev + 1))
                    start = prev = h
            out_blocks.append((day, start, prev + 1))
        return out_blocks

    blocks = _slot_blocks()

    def _fits_availability(day: str, start_time: str, end_time: str) -> bool:
        hours = avail_map.get(day) or set()
        sh = _parse_hour(start_time)
        eh = _parse_hour(end_time)
        if sh is None or eh is None or eh <= sh or not hours:
            return False
        for h in range(sh, eh):
            if h not in hours:
                return False
        return True

    def _assign_slot(i: int) -> tuple[str, str, str]:
        if blocks:
            day, sh, eh = blocks[i % len(blocks)]
            return day, f"{sh:02d}:00", f"{eh:02d}:00"
        return "Mon", "18:00", "19:00"

    styles = [str(s).strip().lower() for s in (context.get("preferences") or {}).get("learningStyles", []) if str(s).strip()]

    def _style_hint() -> str:
        if not styles:
            return "active recall"
        if any("visual" in s for s in styles):
            return "visual aids"
        if any("auditory" in s for s in styles):
            return "teach-back audio review"
        if any("reading" in s or "writing" in s for s in styles):
            return "written summary"
        if any("kinesthetic" in s for s in styles):
            return "practice problems"
        if any("collaborative" in s for s in styles):
            return "peer discussion"
        return "active recall"

    courses = [str((c or {}).get("name") or "").strip() for c in (context.get("courses") or []) if (c or {}).get("name")]
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for r in recommendations or []:
        if not isinstance(r, dict):
            continue
        key = (
            str(r.get("courseName") or "").strip().lower(),
            str(r.get("day") or "").strip().lower(),
            str(r.get("startTime") or "").strip(),
        )
        if key in seen:
            continue
        seen.add(key)
        rr = dict(r)
        day = str(rr.get("day") or "")
        start_time = str(rr.get("startTime") or "")
        end_time = str(rr.get("endTime") or "")
        if not _fits_availability(day, start_time, end_time):
            ad, ast, aet = _assign_slot(len(out))
            rr["day"] = ad
            rr["startTime"] = ast
            rr["endTime"] = aet
        out.append(rr)

    if urgent and out:
        action = _deadline_action_text(urgent["title"], urgent["days"])
        merged_text = " ".join([str((r or {}).get("task") or "") for r in out]).lower()
        has_deadline_task = any(k in merged_text for k in ("exam", "deadline", "due", "homework", "assignment", "quiz", "midterm", "final", "test"))
        if not has_deadline_task:
            urgent_course = _norm(str(urgent.get("courseName") or ""))
            target_idx = -1
            for i, r in enumerate(out):
                r_course = _norm(str((r or {}).get("courseName") or ""))
                same_course = not urgent_course or (r_course and (urgent_course in r_course or r_course in urgent_course))
                if same_course and _is_day_before_due(str((r or {}).get("day") or ""), str(urgent.get("date") or "")):
                    target_idx = i
                    break
            if target_idx >= 0:
                out[target_idx] = {
                    **out[target_idx],
                    "task": f"{action} - {str(out[target_idx].get('task') or 'Focused review')} ({_style_hint()})",
                    "priority": "high",
                }
            else:
                # Create one explicit pre-deadline block instead of mislabeling an arbitrary day.
                try:
                    due = datetime.fromisoformat(str(urgent.get("date") or "").replace("Z", "+00:00")).date()
                except Exception:
                    try:
                        due = date.fromisoformat(str(urgent.get("date") or ""))
                    except Exception:
                        due = None
                day_name = ((due - timedelta(days=1)).strftime("%a") if due else "Wed")
                out = [
                    {
                        "day": day_name,
                        "startTime": "18:00",
                        "endTime": "19:00",
                        "courseName": urgent["courseName"] or context.get("topic", "Course"),
                        "task": f"{action} - {urgent['title']} ({_style_hint()})",
                        "minutes": 60,
                        "priority": "high",
                    },
                    *out,
                ][:3]
                if out and not _fits_availability(str(out[0].get("day") or ""), str(out[0].get("startTime") or ""), str(out[0].get("endTime") or "")):
                    ad, ast, aet = _assign_slot(0)
                    out[0]["day"], out[0]["startTime"], out[0]["endTime"] = ad, ast, aet

    # Keep variety across courses: fill missing course suggestions with generic blocks.
    wanted = min(3, len(courses)) if courses else 0
    present_courses = {str((r or {}).get("courseName") or "").strip().lower() for r in out}
    for c in courses:
        if len(out) >= 3:
            break
        if c.lower() in present_courses:
            continue
        out.append(
            {
                "day": _assign_slot(len(out))[0],
                "startTime": _assign_slot(len(out))[1],
                "endTime": _assign_slot(len(out))[2],
                "courseName": c,
                "task": f"Focused review - {c} ({_style_hint()})",
                "minutes": 45,
                "priority": "medium",
            }
        )
        present_courses.add(c.lower())
    if wanted and len(out) < wanted:
        # If model returned too little, keep appending from known courses until we hit target.
        for c in courses:
            if len(out) >= wanted:
                break
            out.append(
                {
                    "day": _assign_slot(len(out))[0],
                    "startTime": _assign_slot(len(out))[1],
                    "endTime": _assign_slot(len(out))[2],
                    "courseName": c,
                    "task": f"Practice problems - {c} ({_style_hint()})",
                    "minutes": 45,
                    "priority": "medium",
                }
            )
    return out[:3]


def _normalize_ai_result(raw: dict[str, Any], fallback: dict, context: dict[str, Any]) -> dict[str, Any]:
    recommendation = str(raw.get("recommendation") or "").strip()
    reason = str(raw.get("reason") or "").strip()
    recommendations = raw.get("recommendations")
    if not recommendation:
        return fallback
    out = {
        "recommendation": recommendation,
        "reason": reason or fallback.get("reason", ""),
        "source": "openai",
    }
    out["recommendations"] = recommendations if isinstance(recommendations, list) else (fallback.get("recommendations") or [])
    urgent = _urgent_deadline(context)
    if urgent:
        action = _deadline_action_text(urgent["title"], urgent["days"])
        rec_text = f"{recommendation} {reason}".lower()
        has_deadline_language = any(k in rec_text for k in ("exam", "deadline", "due", "homework", "assignment", "quiz", "midterm", "final"))
        if not has_deadline_language:
            out["recommendation"] = f"{action}. {out['recommendation']}"
    out["recommendations"] = _ensure_balanced_recommendations(context, out["recommendations"], urgent)
    return out


def _ai_with_openai(context: dict[str, Any], fallback: dict) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback
    try:
        from openai import OpenAI
    except Exception:
        return _fallback_recommendation(
            {"topic": context.get("topic", "general studies")},
            {"plan": {"input_received": {"courses": context.get("courses") or []}}},
            reason_suffix="OpenAI SDK is not installed.",
        )

    system_prompt = (
        "You are a study scheduling assistant. Provide practical, specific schedule change suggestions based on user context. "
        "Always return valid JSON with keys: recommendation (string), reason (string), "
        "recommendations (array of up to 3 objects with day, startTime, endTime, courseName, task, minutes, priority). "
        "Prioritize near exams/deadlines and adapt every task to the user's learningStyles."
    )
    exam_signal = _exam_signal(context)
    user_prompt = (
        "Create personalized schedule recommendations using this context. "
        "Output concrete schedule edits the student can apply now. "
        "Respect deadlines and availability where possible.\n\n"
        f"Exam signal: {exam_signal}\n\n"
        f"{json.dumps(context, ensure_ascii=True)}"
    )
    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = (resp.choices[0].message.content or "").strip()
    parsed = json.loads(content) if content else {}
    if not isinstance(parsed, dict):
        return fallback
    return _normalize_ai_result(parsed, fallback, context)


def get_ai_recommendation(payload: dict, state: dict) -> dict:
    fallback = _fallback_recommendation(payload, state)
    context = _build_ai_context(payload, state)
    try:
        return _ai_with_openai(context, fallback)
    except Exception:
        return _fallback_recommendation(payload, state, reason_suffix="AI provider unavailable.")

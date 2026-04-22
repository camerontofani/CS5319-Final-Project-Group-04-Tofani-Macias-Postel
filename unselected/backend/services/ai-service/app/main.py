import json
import os
from datetime import date, datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI / Recommendations Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/internal/recommend")
def recommend(payload: dict):
    topic = payload.get("topic", "general studies")
    state = payload.get("userState") or {}

    plan = state.get("plan") or {}
    raw_courses = (plan.get("input_received") or {}).get("courses") or []
    courses = [c.get("name", "") for c in raw_courses if c.get("name")]
    courses_str = ", ".join(courses) if courses else topic
    preferences = (plan.get("input_received") or {}).get("preferences") or {}
    learning_styles = preferences.get("learningStyles") or []
    progress_logs = state.get("progressLogs") or []
    deadlines = state.get("deadlines") or []
    available = (plan.get("input_received") or {}).get("availability") or []

    def _days_until(iso_value: str):
        try:
            due = datetime.fromisoformat(str(iso_value).replace("Z", "+00:00")).date()
        except Exception:
            try:
                due = date.fromisoformat(str(iso_value))
            except Exception:
                return None
        return (due - date.today()).days

    urgent_exam = None
    for d in deadlines:
        title = str(d.get("title") or "").lower()
        if "exam" not in title and "midterm" not in title and "final" not in title and "quiz" not in title:
            continue
        days = _days_until(str(d.get("date") or ""))
        if days is not None and 0 <= days <= 10:
            if urgent_exam is None or days < urgent_exam[0]:
                urgent_exam = (days, str(d.get("title") or "Exam"))

    urgent_deadline = None
    for d in deadlines:
        days = _days_until(str(d.get("date") or ""))
        if days is None or days < 0 or days > 7:
            continue
        if urgent_deadline is None or days < urgent_deadline[0]:
            urgent_deadline = (days, str(d.get("title") or "deadline"), str(d.get("courseCode") or ""), str(d.get("date") or ""))

    def _deadline_action_text(title: str, days: int):
        t = title.lower()
        when = "today" if days <= 0 else "tomorrow" if days == 1 else f"in {days}d"
        if any(k in t for k in ("exam", "midterm", "final", "quiz")):
            return f"Study for exam ({when})"
        if any(k in t for k in ("hw", "homework", "assignment", "problem set", "pset")):
            return f"Complete homework ({when})"
        return f"Prepare for {title} ({when})"

    def _ensure_balanced_recommendations(recommendations):
        def _day_to_idx(day_label):
            d = str(day_label or "").strip().lower()[:3]
            mapping = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}
            return mapping.get(d)

        def _is_day_before_due(session_day, due_iso):
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
            due_idx = (due.weekday() + 1) % 7
            return sidx == (due_idx + 6) % 7

        def _norm(value):
            return "".join(ch for ch in str(value or "").lower() if ch.isalnum())

        def _parse_hour(time_value):
            try:
                return int(str(time_value or "").split(":")[0])
            except Exception:
                return None

        avail_map = {}
        for row in available:
            day = str((row or {}).get("day") or "")
            hours = {int(h) for h in ((row or {}).get("hours") or []) if isinstance(h, int)}
            if day and hours:
                avail_map[day] = hours

        def _slot_blocks():
            out_blocks = []
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

        def _fits_availability(day, start_time, end_time):
            hours = avail_map.get(day) or set()
            sh = _parse_hour(start_time)
            eh = _parse_hour(end_time)
            if sh is None or eh is None or eh <= sh or not hours:
                return False
            for h in range(sh, eh):
                if h not in hours:
                    return False
            return True

        def _assign_slot(i):
            if blocks:
                day, sh, eh = blocks[i % len(blocks)]
                return day, f"{sh:02d}:00", f"{eh:02d}:00"
            return "Mon", "18:00", "19:00"

        style_list = [str(s).strip().lower() for s in learning_styles if str(s).strip()]

        def _style_hint():
            if not style_list:
                return "active recall"
            if any("visual" in s for s in style_list):
                return "visual aids"
            if any("auditory" in s for s in style_list):
                return "teach-back audio review"
            if any("reading" in s or "writing" in s for s in style_list):
                return "written summary"
            if any("kinesthetic" in s for s in style_list):
                return "practice problems"
            if any("collaborative" in s for s in style_list):
                return "peer discussion"
            return "active recall"

        course_names = [str(c.get("name") or "").strip() for c in raw_courses if c.get("name")]
        out = []
        seen = set()
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

        if urgent_deadline and out:
            action = _deadline_action_text(urgent_deadline[1], urgent_deadline[0])
            merged_text = " ".join([str((r or {}).get("task") or "") for r in out]).lower()
            has_deadline_task = any(
                k in merged_text for k in ("exam", "deadline", "due", "homework", "assignment", "quiz", "midterm", "final", "test")
            )
            if not has_deadline_task:
                urgent_course = _norm(urgent_deadline[2])
                target_idx = -1
                for i, r in enumerate(out):
                    r_course = _norm((r or {}).get("courseName"))
                    same_course = (not urgent_course) or (r_course and (urgent_course in r_course or r_course in urgent_course))
                    if same_course and _is_day_before_due((r or {}).get("day"), urgent_deadline[3]):
                        target_idx = i
                        break
                if target_idx >= 0:
                    out[target_idx] = {
                        **out[target_idx],
                        "task": f"{action} - {str(out[target_idx].get('task') or 'Focused review')} ({_style_hint()})",
                        "priority": "high",
                    }
                else:
                    try:
                        due = datetime.fromisoformat(str(urgent_deadline[3]).replace("Z", "+00:00")).date()
                    except Exception:
                        try:
                            due = date.fromisoformat(str(urgent_deadline[3]))
                        except Exception:
                            due = None
                    day_name = ((due - timedelta(days=1)).strftime("%a") if due else "Wed")
                    out = [
                        {
                            "day": day_name,
                            "startTime": "18:00",
                            "endTime": "19:00",
                            "courseName": urgent_deadline[2] or (courses[0] if courses else topic),
                            "task": f"{action} - {urgent_deadline[1]} ({_style_hint()})",
                            "minutes": 60,
                            "priority": "high",
                        },
                        *out,
                    ][:3]
                    if out and not _fits_availability(str(out[0].get("day") or ""), str(out[0].get("startTime") or ""), str(out[0].get("endTime") or "")):
                        ad, ast, aet = _assign_slot(0)
                        out[0]["day"], out[0]["startTime"], out[0]["endTime"] = ad, ast, aet

        present = {str((r or {}).get("courseName") or "").strip().lower() for r in out}
        for c in course_names:
            if len(out) >= 3:
                break
            if c.lower() in present:
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
            present.add(c.lower())
        return out[:3]

    fallback = {
        "recommendation": (
            f"Prioritize {courses_str}: use one 45-minute focused session, then a 10-minute active recall review."
        ),
        "reason": "Based on your plan, deadlines, and recent progress.",
        "source": "fallback",
        "recommendations": [
            {
                "day": "Next available day",
                "startTime": "next-open-slot",
                "endTime": "next-open-slot",
                "courseName": courses[0] if courses else topic,
                "task": "Focused review + active recall",
                "minutes": 45,
                "priority": "high" if urgent_exam else "medium",
            }
        ],
    }
    if urgent_deadline:
        action = _deadline_action_text(urgent_deadline[1], urgent_deadline[0])
        fallback["recommendation"] = f"{action}. {fallback['recommendation']}"
        fallback["recommendations"][0]["task"] = f"{action} - {urgent_deadline[1]}"

    context = {
        "topic": topic,
        "courses": raw_courses,
        "availability": available,
        "preferences": preferences,
        "learningStyles": learning_styles,
        "recent_progress": progress_logs[-8:],
        "deadlines": deadlines[:10],
        "exam_signal": (
            f"Closest exam: {urgent_exam[1]} in {urgent_exam[0]} day(s)."
            if urgent_exam
            else "No exam in the next 10 days."
        ),
    }

    try:
        from openai import OpenAI

        api_key = os.getenv("OPENAI_API_KEY")
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        if not api_key:
            return fallback
        client = OpenAI(api_key=api_key)
        prompt = (
            "You are a study scheduling assistant. Return valid JSON with keys: "
            "recommendation (string), reason (string), recommendations (array up to 3 schedule edits). "
            "Each schedule edit needs: day, startTime, endTime, courseName, task, minutes, priority. "
            "Use learning styles and exam urgency. Adapt each task to learning style explicitly.\n\n"
            f"{json.dumps(context, ensure_ascii=True)}"
        )
        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        content = (response.choices[0].message.content or "").strip()
        parsed = json.loads(content) if content else {}
        if not isinstance(parsed, dict):
            return fallback
        recommendation = str(parsed.get("recommendation") or "").strip()
        reason = str(parsed.get("reason") or "").strip()
        recommendations = parsed.get("recommendations")
        if not recommendation:
            return fallback
        out = {
            "recommendation": recommendation,
            "reason": reason or fallback["reason"],
            "source": "openai",
            "recommendations": recommendations if isinstance(recommendations, list) else fallback["recommendations"],
        }
        if urgent_deadline:
            action = _deadline_action_text(urgent_deadline[1], urgent_deadline[0])
            merged_text = f"{out['recommendation']} {out['reason']}".lower()
            has_deadline_language = any(
                k in merged_text for k in ("exam", "deadline", "due", "homework", "assignment", "quiz", "midterm", "final")
            )
            if not has_deadline_language:
                out["recommendation"] = f"{action}. {out['recommendation']}"
        out["recommendations"] = _ensure_balanced_recommendations(out["recommendations"])
        return out
    except Exception:
        return fallback

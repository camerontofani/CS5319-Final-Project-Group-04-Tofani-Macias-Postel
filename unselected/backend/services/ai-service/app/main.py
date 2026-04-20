import anthropic
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

    prompt = (
        f"You are a study coach. A student is studying: {courses_str}.\n\n"
        f"Recent study sessions:\n{recent_str}\n\n"
        f"Upcoming deadlines:\n{deadlines_str}\n\n"
        "Give one specific, actionable study tip in 1-2 sentences. Be direct and practical."
    )

    try:
        client = anthropic.Anthropic()
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        recommendation = message.content[0].text.strip()
    except Exception:
        recommendation = f"Focus on {courses_str} in shorter sessions with regular breaks."

    return {
        "recommendation": recommendation,
        "reason": f"Based on your recent activity across {courses_str}.",
    }

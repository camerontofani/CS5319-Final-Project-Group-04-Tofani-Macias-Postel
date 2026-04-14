# later: call external llm api from integrations/; keep prompts and parsing here


def get_ai_recommendation(payload: dict):
    topic = payload.get("topic", "General review")
    return {
        "message": "AI recommendation placeholder (Milestone 5)",
        "recommendation": f"Prioritize {topic} and split into 25-minute blocks.",
        "reason": "Upcoming deadline and low confidence trend.",
    }

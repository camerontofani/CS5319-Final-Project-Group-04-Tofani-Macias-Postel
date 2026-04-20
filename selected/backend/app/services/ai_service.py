def get_ai_recommendation(payload: dict) -> dict:
    topic = payload.get("topic", "your plan")
    return {
        "recommendation": f"Focus on {topic} in shorter sessions with breaks.",
        "reason": "Balances workload using your recent activity.",
    }

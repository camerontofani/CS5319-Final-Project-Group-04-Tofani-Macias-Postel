# builds a study schedule from courses, exams, and availability (stub for now)


def create_study_plan(payload: dict):
    # echo input so we can see the frontend sent the right shape
    return {
        "message": "Study plan placeholder (Milestone 2)",
        "input_received": payload,
        "sample_tasks": [
            {"day": "Monday", "task": "Review chapter 1", "minutes": 45},
            {"day": "Tuesday", "task": "Practice quiz", "minutes": 30},
        ],
    }

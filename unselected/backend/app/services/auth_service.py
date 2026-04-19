# auth business logic for the monolith (replace with db + hashing later)


def signup_user(payload: dict):
    # pull email from request body; default is only for quick manual testing
    email = payload.get("email", "student@example.edu")
    return {
        "message": "Signup placeholder (Milestone 1)",
        "user": {"email": email, "role": "student"},
    }

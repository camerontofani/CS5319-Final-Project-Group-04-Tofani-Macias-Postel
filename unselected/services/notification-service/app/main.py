# optional: reminders and alerts (nice-to-have in the proposal)
from fastapi import FastAPI

app = FastAPI(title="Notification Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "notification-service"}


@app.post("/send")
def send_notification(payload: dict):
    return {"message": "Notification placeholder (Nice-to-have)", "payload": payload}

from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):

    id: int

    user_id: int

    notification_type: str

    recipient: str

    subject: str

    body: str

    status: str

    attempts: int

    last_error: str | None

    created_at: datetime

    sent_at: datetime | None

    model_config = {
        "from_attributes": True
    }
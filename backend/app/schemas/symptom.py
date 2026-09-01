from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SymptomCreate(BaseModel):

    appointment_id: int

    symptoms: str


class SymptomResponse(BaseModel):

    id: int

    appointment_id: int

    symptoms: str

    urgency_level: str | None = None

    chief_complaint: str | None = None

    suggested_questions: list[str] | None = None

    ai_summary: str | None = None

    summary: dict | None = None

    status: str | None = None

    generated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
from pydantic import BaseModel


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

    class Config:
        from_attributes = True
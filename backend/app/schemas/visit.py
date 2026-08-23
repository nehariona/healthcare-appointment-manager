from pydantic import BaseModel, Field, ConfigDict


class VisitCreate(BaseModel):

    appointment_id: int

    clinical_notes: str = Field(
        min_length=1
    )

    prescription: str = ""


class VisitResponse(BaseModel):

    id: int

    appointment_id: int

    clinical_notes: str = Field(
        validation_alias="doctor_notes"
    )

    prescription: str | None = None

    ai_summary: str | None = Field(
        default=None,
        validation_alias="patient_summary"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
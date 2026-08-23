from datetime import time

from pydantic import BaseModel, Field


class DoctorCreate(BaseModel):

    specialization: str

    experience_years: int = Field(
        ge=0
    )

    hospital: str

    working_start: time = time(9, 0)

    working_end: time = time(17, 0)

    slot_duration: int = Field(
        default=30,
        ge=5,
        le=120
    )


class DoctorResponse(BaseModel):

    id: int
    full_name: str

    user_id: int

    specialization: str

    experience_years: int

    hospital: str

    working_start: time

    working_end: time

    slot_duration: int

    is_active: bool

    class Config:
        from_attributes = True
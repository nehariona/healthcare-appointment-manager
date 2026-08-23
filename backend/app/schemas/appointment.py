from datetime import datetime

from pydantic import BaseModel


# =========================================================
# CREATE APPOINTMENT
# =========================================================

class AppointmentCreate(BaseModel):

    doctor_id: int

    appointment_time: datetime

    reason: str | None = None


# =========================================================
# APPOINTMENT RESPONSE
# =========================================================

class AppointmentResponse(BaseModel):

    id: int

    patient_id: int

    doctor_id: int

    appointment_time: datetime

    status: str

    reason: str | None = None

    # Google Calendar event ID
    # Used internally to update/delete the
    # corresponding Google Calendar event.
    google_calendar_event_id: str | None = None

    class Config:
        from_attributes = True


# =========================================================
# AVAILABLE SLOT
# =========================================================

class AvailableSlot(BaseModel):

    appointment_time: datetime

    available: bool = True


# =========================================================
# RESCHEDULE APPOINTMENT
# =========================================================

class RescheduleRequest(BaseModel):

    new_time: datetime
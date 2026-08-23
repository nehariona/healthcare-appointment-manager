from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Appointment(Base):

    __tablename__ = "appointments"

    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "appointment_time",
            name="uq_doctor_appointment_time",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"),
        nullable=False,
    )

    # PostgreSQL TIMESTAMP WITH TIME ZONE
    # Values are stored consistently by PostgreSQL.
    appointment_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="scheduled",
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Google Calendar event belonging to this appointment
    google_calendar_event_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

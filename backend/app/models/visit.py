from sqlalchemy import (
    Text,
    ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Visit(Base):

    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id"),
        unique=True,
        nullable=False
    )

    doctor_notes: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    prescription: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    patient_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
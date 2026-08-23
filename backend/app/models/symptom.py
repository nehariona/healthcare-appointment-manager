from sqlalchemy import ForeignKey, Text, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Symptom(Base):

    __tablename__ = "symptoms"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id"),
        nullable=False,
        unique=True
    )

    symptoms: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    urgency_level: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    chief_complaint: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    suggested_questions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    ai_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
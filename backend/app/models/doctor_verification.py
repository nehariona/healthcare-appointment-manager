from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DoctorVerification(Base):
    __tablename__ = "doctor_verifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    government_id_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    medical_license_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    specialization: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    hospital: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
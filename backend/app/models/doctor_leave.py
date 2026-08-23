from datetime import date

from sqlalchemy import (
    Date,
    ForeignKey,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DoctorLeave(Base):

    __tablename__ = "doctor_leaves"

    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "leave_date",
            name="uq_doctor_leave_date"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"),
        nullable=False
    )

    leave_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
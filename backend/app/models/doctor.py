from datetime import time

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    Time,
    Boolean
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Doctor(Base):

    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    specialization: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    hospital: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    working_start: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(9, 0)
    )

    working_end: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(17, 0)
    )

    slot_duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
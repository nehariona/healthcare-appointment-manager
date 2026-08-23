from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer
)

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    # ---------------------------------------------------------
    # PRIMARY KEY
    # ---------------------------------------------------------

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ---------------------------------------------------------
    # USER WHO RECEIVES THE NOTIFICATION
    # ---------------------------------------------------------

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # ---------------------------------------------------------
    # NOTIFICATION TYPE
    # ---------------------------------------------------------

    notification_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    # Examples:
    #
    # booking_confirmation
    # new_appointment
    # appointment_cancelled
    # appointment_rescheduled
    # doctor_leave
    # appointment_reminder
    # medication_reminder
    # visit_summary

    # ---------------------------------------------------------
    # EMAIL RECIPIENT
    # ---------------------------------------------------------

    recipient: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # ---------------------------------------------------------
    # EMAIL SUBJECT
    # ---------------------------------------------------------

    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # ---------------------------------------------------------
    # EMAIL / NOTIFICATION BODY
    # ---------------------------------------------------------

    body: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # ---------------------------------------------------------
    # DELIVERY STATUS
    # ---------------------------------------------------------

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True
    )

    # Possible values:
    #
    # pending
    # sent
    # failed

    # ---------------------------------------------------------
    # NUMBER OF DELIVERY ATTEMPTS
    # ---------------------------------------------------------

    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    # ---------------------------------------------------------
    # LAST ERROR
    # ---------------------------------------------------------

    last_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # ---------------------------------------------------------
    # CREATED TIME
    # ---------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ---------------------------------------------------------
    # SENT TIME
    # ---------------------------------------------------------

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
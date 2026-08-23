from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.appointment import Appointment


IST = ZoneInfo("Asia/Kolkata")

APPOINTMENT_DURATION_MINUTES = 30


def normalize_to_ist(
    appointment_time: datetime,
) -> datetime:
    """
    Convert a datetime to timezone-aware IST.

    Rules:
    - Naive datetime -> assumed to be IST
    - Timezone-aware datetime -> converted to IST
    """

    if appointment_time.tzinfo is None:
        return appointment_time.replace(tzinfo=IST)

    return appointment_time.astimezone(IST)


def validate_appointment_slot(
    db: Session,
    doctor,
    appointment_time: datetime,
    exclude_appointment_id: int | None = None,
):
    """
    Validate whether a doctor is available.

    Rules:
    1. Doctor must exist.
    2. Appointment must be in the future.
    3. Appointment must not overlap another appointment.
    4. Cancelled appointments are ignored.
    5. Current appointment is ignored during rescheduling.
    6. Appointment duration is 30 minutes.

    Returns:
        The normalized appointment time in IST.
    """

    # =====================================================
    # 1. VALIDATE DOCTOR
    # =====================================================

    if doctor is None:
        raise HTTPException(
            status_code=400,
            detail="Doctor is required",
        )

    # =====================================================
    # 2. NORMALIZE REQUEST TIME TO IST
    # =====================================================

    appointment_time = normalize_to_ist(
        appointment_time
    )

    # =====================================================
    # 3. APPOINTMENT MUST BE IN THE FUTURE
    # =====================================================

    now = datetime.now(IST)

    if appointment_time <= now:
        raise HTTPException(
            status_code=400,
            detail="Appointment time must be in the future",
        )

    # =====================================================
    # 4. CALCULATE NEW APPOINTMENT END
    # =====================================================

    appointment_end = (
        appointment_time
        + timedelta(
            minutes=APPOINTMENT_DURATION_MINUTES
        )
    )

    # =====================================================
    # 5. GET EXISTING APPOINTMENTS FOR DOCTOR
    # =====================================================

    existing_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status != "cancelled",
        )
        .all()
    )

    # =====================================================
    # 6. CHECK OVERLAP
    # =====================================================

    for existing in existing_appointments:

        # -------------------------------------------------
        # Ignore current appointment during rescheduling
        # -------------------------------------------------

        if (
            exclude_appointment_id is not None
            and existing.id == exclude_appointment_id
        ):
            continue

        # -------------------------------------------------
        # Normalize database datetime to IST
        # -------------------------------------------------

        existing_start = normalize_to_ist(
            existing.appointment_time
        )

        # -------------------------------------------------
        # Existing appointment lasts 30 minutes
        # -------------------------------------------------

        existing_end = (
            existing_start
            + timedelta(
                minutes=APPOINTMENT_DURATION_MINUTES
            )
        )

        # -------------------------------------------------
        # OVERLAP CONDITION
        #
        # New:
        #   appointment_time -> appointment_end
        #
        # Existing:
        #   existing_start -> existing_end
        #
        # Overlap occurs when:
        #
        # new_start < existing_end
        # AND
        # new_end > existing_start
        # -------------------------------------------------

        if (
            appointment_time < existing_end
            and appointment_end > existing_start
        ):
            raise HTTPException(
                status_code=400,
                detail="Doctor is not available at this time",
            )

    # =====================================================
    # 7. RETURN NORMALIZED IST TIME
    # =====================================================

    return appointment_time

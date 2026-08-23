from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.user import User
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.doctor_verification import DoctorVerification
from app.models.doctor_leave import DoctorLeave

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AvailableSlot,
    RescheduleRequest,
)

from app.services.appointment_service import (
    validate_appointment_slot,
    normalize_to_ist,
)

from app.services.notification_service import (
    create_notification,
    process_notification,
)
from app.services.google_calendar_service import (
    build_calendar_service_for_user,
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
    format_ist_datetime,
)



router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


IST = ZoneInfo("Asia/Kolkata")


# =========================================================
# IST HELPER
# =========================================================


# =========================================================
# BOOK APPOINTMENT
# =========================================================

@router.post(
    "/",
    response_model=AppointmentResponse,
)
def book_appointment(
    request: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # ONLY PATIENTS CAN BOOK
    # -----------------------------------------------------

    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can book appointments",
        )

    # -----------------------------------------------------
    # FIND ACTIVE DOCTOR
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == request.doctor_id,
            Doctor.is_active == True,
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found or inactive",
        )

    # -----------------------------------------------------
    # FIND DOCTOR USER
    # -----------------------------------------------------

    doctor_user = (
        db.query(User)
        .filter(
            User.id == doctor.user_id
        )
        .first()
    )

    # -----------------------------------------------------
    # NORMALIZE REQUEST TIME TO IST
    # -----------------------------------------------------

    appointment_time = normalize_to_ist(
        request.appointment_time
    )

    # -----------------------------------------------------
    # VALIDATE APPOINTMENT SLOT
    # -----------------------------------------------------

    appointment_time = validate_appointment_slot(
        db=db,
        doctor=doctor,
        appointment_time=appointment_time,
    )

    # -----------------------------------------------------
    # CREATE APPOINTMENT
    # -----------------------------------------------------

    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.id,
        appointment_time=appointment_time,
        reason=request.reason,
        status="scheduled",
    )

    db.add(appointment)

    # -----------------------------------------------------
    # DATABASE COMMIT
    # -----------------------------------------------------

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="This appointment slot is already booked",
        )

    db.refresh(appointment)

    # =====================================================
    # GOOGLE CALENDAR EVENT
    # =====================================================

    if getattr(
        current_user,
        "google_calendar_connected",
        False,
    ):

        try:

            calendar_service = (
                build_calendar_service_for_user(
                    current_user
                )
            )

            calendar_event = create_calendar_event(
                service=calendar_service,
                appointment_time=appointment.appointment_time,
                doctor_name=(
                    doctor_user.full_name
                    if doctor_user
                    else "Doctor"
                ),
                patient_name=current_user.full_name,
                patient_email=current_user.email,
                doctor_email=(
                    doctor_user.email
                    if doctor_user
                    else ""
                ),
                reason=appointment.reason,
            )

            appointment.google_calendar_event_id = (
                calendar_event.get("id")
            )

            db.commit()
            db.refresh(appointment)

        except Exception as e:

            # Calendar failure should NOT cancel
            # an already successful appointment.

            print(
                f"Google Calendar event creation failed: {e}"
            )

    # -----------------------------------------------------
    # FORMAT TIME
    # -----------------------------------------------------

    appointment_time_ist = format_ist_datetime(
        appointment.appointment_time
    )

    # =====================================================
    # PATIENT NOTIFICATION
    # =====================================================

    patient_notification = create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="booking_confirmation",
        recipient=current_user.email,
        subject="Appointment Booking Confirmation",
        body=(
            "Your appointment has been successfully booked.\n\n"
            f"Doctor: "
            f"{doctor_user.full_name if doctor_user else doctor.id}\n"
            f"Appointment time: {appointment_time_ist}\n"
            f"Reason: {appointment.reason or 'Not specified'}"
        ),
    )

    process_notification(
        db,
        patient_notification,
    )

    # =====================================================
    # DOCTOR NOTIFICATION
    # =====================================================

    if doctor_user:

        doctor_notification = create_notification(
            db=db,
            user_id=doctor_user.id,
            notification_type="new_appointment",
            recipient=doctor_user.email,
            subject="New Appointment Booked",
            body=(
                "A new appointment has been booked.\n\n"
                f"Patient: {current_user.full_name}\n"
                f"Patient Email: {current_user.email}\n"
                f"Appointment time: {appointment_time_ist}\n"
                f"Reason: {appointment.reason or 'Not specified'}"
            ),
        )

        process_notification(
            db,
            doctor_notification,
        )

    return appointment


# =========================================================
# GET AVAILABLE SLOTS
# =========================================================

@router.get(
    "/doctor/{doctor_id}/slots",
    response_model=list[AvailableSlot],
)
def get_available_slots(
    doctor_id: int,
    appointment_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # ONLY PATIENTS
    # -----------------------------------------------------

    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can view available slots",
        )

    # -----------------------------------------------------
    # FIND DOCTOR
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == doctor_id,
            Doctor.is_active == True,
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found or inactive",
        )

    # -----------------------------------------------------
    # CHECK DOCTOR LEAVE
    # -----------------------------------------------------

    leave = (
        db.query(DoctorLeave)
        .filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == appointment_date,
        )
        .first()
    )

    if leave:
        return []

    # -----------------------------------------------------
    # WORKING HOURS
    # -----------------------------------------------------

    start_datetime = datetime.combine(
        appointment_date,
        doctor.working_start,
    ).replace(tzinfo=IST)

    end_datetime = datetime.combine(
        appointment_date,
        doctor.working_end,
    ).replace(tzinfo=IST)

    # -----------------------------------------------------
    # GET EXISTING APPOINTMENTS
    # -----------------------------------------------------

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_time >= start_datetime,
            Appointment.appointment_time < end_datetime,
            Appointment.status != "cancelled",
        )
        .all()
    )

    # -----------------------------------------------------
    # NORMALIZE BOOKED TIMES
    # -----------------------------------------------------

    booked_times = {
        normalize_to_ist(
            appointment.appointment_time
        )
        for appointment in appointments
    }

    # -----------------------------------------------------
    # GENERATE SLOTS
    # -----------------------------------------------------

    slots = []

    current_time = start_datetime

    now = datetime.now(IST)

    while (
        current_time
        + timedelta(minutes=doctor.slot_duration)
        <= end_datetime
    ):

        if (
            current_time > now
            and current_time not in booked_times
        ):

            slots.append(
                AvailableSlot(
                    appointment_time=current_time,
                    available=True,
                )
            )

        current_time += timedelta(
            minutes=doctor.slot_duration
        )

    return slots


# =========================================================
# CANCEL APPOINTMENT
# =========================================================

@router.delete(
    "/{appointment_id}"
)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # FIND APPOINTMENT
    # -----------------------------------------------------

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    # -----------------------------------------------------
    # ONLY PATIENTS
    # -----------------------------------------------------

    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can cancel appointments",
        )

    # -----------------------------------------------------
    # VERIFY OWNERSHIP
    # -----------------------------------------------------

    if appointment.patient_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not your appointment",
        )

    # -----------------------------------------------------
    # CHECK STATUS
    # -----------------------------------------------------

    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Appointment is already cancelled",
        )

    # -----------------------------------------------------
    # FIND DOCTOR
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == appointment.doctor_id
        )
        .first()
    )

    # -----------------------------------------------------
    # FIND DOCTOR USER
    # -----------------------------------------------------

    doctor_user = None

    if doctor:

        doctor_user = (
            db.query(User)
            .filter(
                User.id == doctor.user_id
            )
            .first()
        )

    # -----------------------------------------------------
    # FORMAT TIME
    # -----------------------------------------------------

    appointment_time_ist = format_ist_datetime(
        appointment.appointment_time
    )

    # =====================================================
    # DELETE GOOGLE CALENDAR EVENT
    # =====================================================

    if (
        appointment.google_calendar_event_id
        and getattr(
            current_user,
            "google_calendar_connected",
            False,
        )
    ):

        try:

            calendar_service = (
                build_calendar_service_for_user(
                    current_user
                )
            )

            delete_calendar_event(
                service=calendar_service,
                event_id=appointment.google_calendar_event_id,
            )

        except Exception as e:

            # Calendar failure should not prevent
            # appointment cancellation.

            print(
                f"Google Calendar event deletion failed: {e}"
            )

    # -----------------------------------------------------
    # CANCEL APPOINTMENT
    # -----------------------------------------------------

    appointment.status = "cancelled"

    # Clear calendar event ID because the event
    # has been deleted.
    appointment.google_calendar_event_id = None

    db.commit()
    db.refresh(appointment)

    # =====================================================
    # PATIENT NOTIFICATION
    # =====================================================

    patient_notification = create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="appointment_cancelled",
        recipient=current_user.email,
        subject="Appointment Cancelled",
        body=(
            "Your appointment has been cancelled.\n\n"
            f"Appointment time: {appointment_time_ist}"
        ),
    )

    process_notification(
        db,
        patient_notification,
    )

    # =====================================================
    # DOCTOR NOTIFICATION
    # =====================================================

    if doctor_user:

        doctor_notification = create_notification(
            db=db,
            user_id=doctor_user.id,
            notification_type="appointment_cancelled",
            recipient=doctor_user.email,
            subject="Appointment Cancelled",
            body=(
                "An appointment has been cancelled by the patient.\n\n"
                f"Appointment ID: {appointment.id}\n"
                f"Patient: {current_user.full_name}\n"
                f"Appointment time: {appointment_time_ist}"
            ),
        )

        process_notification(
            db,
            doctor_notification,
        )

    return {
        "message": "Appointment cancelled successfully"
    }


# =========================================================
# RESCHEDULE APPOINTMENT
# =========================================================

@router.put(
    "/{appointment_id}/reschedule",
    response_model=AppointmentResponse,
)
def reschedule_appointment(
    appointment_id: int,
    request: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # ONLY DOCTORS
    # -----------------------------------------------------

    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can reschedule appointments",
        )

    # -----------------------------------------------------
    # FIND DOCTOR
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.user_id == current_user.id
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found",
        )

    # -----------------------------------------------------
    # FIND APPOINTMENT
    # -----------------------------------------------------

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    # -----------------------------------------------------
    # VERIFY DOCTOR OWNERSHIP
    # -----------------------------------------------------

    if appointment.doctor_id != doctor.id:
        raise HTTPException(
            status_code=403,
            detail="You can only reschedule your own appointments",
        )

    # -----------------------------------------------------
    # CANCELLED CHECK
    # -----------------------------------------------------

    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled appointment cannot be rescheduled",
        )

    # -----------------------------------------------------
    # NORMALIZE NEW TIME
    # -----------------------------------------------------

    new_time = normalize_to_ist(
        request.new_time
    )

    # -----------------------------------------------------
    # VALIDATE NEW SLOT
    # -----------------------------------------------------

    new_time = validate_appointment_slot(
        db=db,
        doctor=doctor,
        appointment_time=new_time,
        exclude_appointment_id=appointment.id,
    )

    # -----------------------------------------------------
    # SAVE OLD TIME
    # -----------------------------------------------------

    old_time = appointment.appointment_time

    old_time_ist = format_ist_datetime(
        old_time
    )

    new_time_ist = format_ist_datetime(
        new_time
    )

    # -----------------------------------------------------
    # UPDATE DATABASE APPOINTMENT
    # -----------------------------------------------------

    appointment.appointment_time = new_time
    appointment.status = "rescheduled"

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="This appointment slot is already booked",
        )

    db.refresh(appointment)

    # =====================================================
    # GOOGLE CALENDAR UPDATE
    # =====================================================

    if (
        appointment.google_calendar_event_id
        and getattr(
            current_user,
            "google_calendar_connected",
            False,
        )
    ):

        try:

            calendar_service = (
                build_calendar_service_for_user(
                    current_user
                )
            )

            # Find patient
            patient = (
                db.query(User)
                .filter(
                    User.id == appointment.patient_id
                )
                .first()
            )

            update_calendar_event(
                service=calendar_service,
                event_id=appointment.google_calendar_event_id,
                appointment_time=appointment.appointment_time,
                doctor_name=current_user.full_name,
                patient_name=(
                    patient.full_name
                    if patient
                    else "Patient"
                ),
                patient_email=(
                    patient.email
                    if patient
                    else ""
                ),
                doctor_email=current_user.email,
                reason=appointment.reason,
            )

        except Exception as e:

            print(
                f"Google Calendar event update failed: {e}"
            )

    # -----------------------------------------------------
    # FIND PATIENT
    # -----------------------------------------------------

    patient = (
        db.query(User)
        .filter(
            User.id == appointment.patient_id
        )
        .first()
    )

    # =====================================================
    # PATIENT NOTIFICATION
    # =====================================================

    if patient:

        patient_notification = create_notification(
            db=db,
            user_id=patient.id,
            notification_type="appointment_rescheduled",
            recipient=patient.email,
            subject="Appointment Rescheduled",
            body=(
                "Your appointment has been rescheduled.\n\n"
                f"Previous time: {old_time_ist}\n"
                f"New time: {new_time_ist}"
            ),
        )

        process_notification(
            db,
            patient_notification,
        )

    # =====================================================
    # DOCTOR NOTIFICATION
    # =====================================================

    doctor_notification = create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="appointment_rescheduled",
        recipient=current_user.email,
        subject="Appointment Rescheduled",
        body=(
            "Appointment rescheduled successfully.\n\n"
            f"Appointment ID: {appointment.id}\n"
            f"Previous time: {old_time_ist}\n"
            f"New time: {new_time_ist}"
        ),
    )

    process_notification(
        db,
        doctor_notification,
    )

    return appointment


# =========================================================
# GET MY APPOINTMENTS
# =========================================================

@router.get(
    "/my"
)
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # =====================================================
    # PATIENT APPOINTMENTS
    # =====================================================

    if current_user.role == "patient":

        appointments = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == current_user.id
            )
            .order_by(
                Appointment.appointment_time.desc()
            )
            .all()
        )

        result = []

        for appointment in appointments:

            doctor = (
                db.query(Doctor)
                .filter(
                    Doctor.id == appointment.doctor_id
                )
                .first()
            )

            doctor_user = None

            if doctor:

                doctor_user = (
                    db.query(User)
                    .filter(
                        User.id == doctor.user_id
                    )
                    .first()
                )

            result.append({

                "appointment_id": appointment.id,

                "patient_id": current_user.id,

                "patient_name": current_user.full_name,

                "patient_email": current_user.email,

                "doctor_id": (
                    doctor.id
                    if doctor
                    else None
                ),

                "doctor_name": (
                    doctor_user.full_name
                    if doctor_user
                    else None
                ),

                "doctor_email": (
                    doctor_user.email
                    if doctor_user
                    else None
                ),

                "appointment_time": normalize_to_ist(
                    appointment.appointment_time
                ),

                "appointment_time_ist": format_ist_datetime(
                    appointment.appointment_time
                ),

                "status": appointment.status,

                "reason": appointment.reason,

                "google_calendar_event_id": (
                    appointment.google_calendar_event_id
                ),

            })

        return result

    # =====================================================
    # DOCTOR APPOINTMENTS
    # =====================================================

    elif current_user.role == "doctor":

        doctor = (
            db.query(Doctor)
            .filter(
                Doctor.user_id == current_user.id
            )
            .first()
        )

        if not doctor:
            verification = (
                db.query(DoctorVerification)
                .filter(
                    DoctorVerification.doctor_id == current_user.id
                )
                .order_by(DoctorVerification.created_at.desc())
                .first()
            )

            if not verification:
                return []

            doctor = Doctor(
                user_id=current_user.id,
                specialization=verification.specialization,
                experience_years=verification.experience_years,
                hospital=verification.hospital,
                working_start=datetime.strptime("09:00", "%H:%M").time(),
                working_end=datetime.strptime("17:00", "%H:%M").time(),
                slot_duration=30,
                is_active=True,
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)

        appointments = (
            db.query(Appointment)
            .filter(
                Appointment.doctor_id == doctor.id
            )
            .order_by(
                Appointment.appointment_time.desc()
            )
            .all()
        )

        result = []

        for appointment in appointments:

            patient = (
                db.query(User)
                .filter(
                    User.id == appointment.patient_id
                )
                .first()
            )

            result.append({

                "appointment_id": appointment.id,

                "doctor_id": doctor.id,

                "doctor_name": current_user.full_name,

                "doctor_email": current_user.email,

                "patient_id": (
                    patient.id
                    if patient
                    else None
                ),

                "patient_name": (
                    patient.full_name
                    if patient
                    else None
                ),

                "patient_email": (
                    patient.email
                    if patient
                    else None
                ),

                "appointment_time": normalize_to_ist(
                    appointment.appointment_time
                ),

                "appointment_time_ist": format_ist_datetime(
                    appointment.appointment_time
                ),

                "status": appointment.status,

                "reason": appointment.reason,

                "google_calendar_event_id": (
                    appointment.google_calendar_event_id
                ),

            })

        return result

    # =====================================================
    # OTHER ROLES
    # =====================================================

    raise HTTPException(
        status_code=403,
        detail="Access denied",
    )
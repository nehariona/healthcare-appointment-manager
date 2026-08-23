from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.user import User
from app.models.doctor import Doctor
from app.models.doctor_leave import DoctorLeave
from app.models.appointment import Appointment
from app.models.doctor_verification import DoctorVerification
from app.models.notification import Notification
from app.services.notification_service import create_notification

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# GET PENDING DOCTORS
# =========================================================

@router.get("/doctors/pending")
def get_pending_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access this endpoint"
        )

    pending_doctors = (
        db.query(DoctorVerification)
        .filter(
            DoctorVerification.status == "pending"
        )
        .all()
    )

    return pending_doctors


# =========================================================
# APPROVE DOCTOR
# =========================================================

@router.post("/doctors/{verification_id}/approve")
def approve_doctor(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can approve doctors"
        )

    verification = (
        db.query(DoctorVerification)
        .filter(
            DoctorVerification.id == verification_id
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Doctor verification request not found"
        )

    if verification.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Doctor verification has already been processed"
        )

    doctor_user = (
        db.query(User)
        .filter(
            User.id == verification.doctor_id
        )
        .first()
    )

    if not doctor_user:
        raise HTTPException(
            status_code=404,
            detail="Doctor user not found"
        )

    doctor_user.is_verified = True
    verification.status = "approved"

    existing_doctor = (
        db.query(Doctor)
        .filter(
            Doctor.user_id == doctor_user.id
        )
        .first()
    )

    if not existing_doctor:
        doctor_profile = Doctor(
            user_id=doctor_user.id,
            specialization=verification.specialization,
            experience_years=verification.experience_years,
            hospital=verification.hospital,
            working_start=time(9, 0),
            working_end=time(17, 0),
            slot_duration=30,
            is_active=True,
        )
        db.add(doctor_profile)

    db.commit()

    return {
        "message": "Doctor approved successfully"
    }


# =========================================================
# MARK DOCTOR LEAVE
# =========================================================

@router.post("/doctors/{doctor_id}/leave")
def mark_doctor_leave(
    doctor_id: int,
    leave_date: date,
    reason: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------------------
    # ONLY ADMIN
    # -----------------------------------------------------

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can manage doctor leave"
        )

    # -----------------------------------------------------
    # FIND DOCTOR
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == doctor_id
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE LEAVE
    # -----------------------------------------------------

    existing_leave = (
        db.query(DoctorLeave)
        .filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == leave_date
        )
        .first()
    )

    if existing_leave:
        raise HTTPException(
            status_code=400,
            detail="Doctor is already on leave on this date"
        )

    # -----------------------------------------------------
    # CREATE LEAVE
    # -----------------------------------------------------

    leave = DoctorLeave(
        doctor_id=doctor_id,
        leave_date=leave_date,
        reason=reason
    )

    db.add(leave)

    # -----------------------------------------------------
    # FIND AFFECTED APPOINTMENTS
    # -----------------------------------------------------

    start_of_day = datetime.combine(
        leave_date,
        datetime.min.time()
    )

    end_of_day = start_of_day + timedelta(days=1)

    affected_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_time >= start_of_day,
            Appointment.appointment_time < end_of_day,
            Appointment.status != "cancelled"
        )
        .all()
    )

    # -----------------------------------------------------
    # GET DOCTOR USER
    # -----------------------------------------------------

    doctor_user = (
        db.query(User)
        .filter(
            User.id == doctor.user_id
        )
        .first()
    )

    # -----------------------------------------------------
    # CANCEL APPOINTMENTS + CREATE NOTIFICATIONS
    # -----------------------------------------------------

    patient_notification_count = 0

    for appointment in affected_appointments:

        appointment.status = "cancelled"

        patient = (
        db.query(User)
        .filter(
            User.id == appointment.patient_id
        )
        .first()
    )

    if patient:

        create_notification(
            db=db,
            user_id=patient.id,
            notification_type="doctor_leave",
            recipient=patient.email,
            subject="Appointment Cancelled - Doctor on Leave",
            body=(
                "Your appointment has been cancelled because "
                "the doctor is on leave.\n\n"
                f"Appointment ID: {appointment.id}\n"
                f"Original appointment time: "
                f"{appointment.appointment_time}\n\n"
                "Please book another available slot."
            )
        )

        # ---------------------------------------------
        # FIND PATIENT
        # ---------------------------------------------

        patient = (
            db.query(User)
            .filter(
                User.id == appointment.patient_id
            )
            .first()
        )

        # ---------------------------------------------
        # NOTIFY PATIENT
        # ---------------------------------------------

        if patient:

            patient_email = getattr(
                patient,
                "email",
                None
            )

            if patient_email:

                patient_notification = Notification(
                    user_id=patient.id,
                    notification_type="appointment_cancelled",
                    recipient=patient_email,
                    subject="Appointment Cancelled - Doctor Leave",
                    body=(
                        f"Your appointment with the doctor on "
                        f"{appointment.appointment_time.strftime('%Y-%m-%d %H:%M')} "
                        f"has been cancelled because the doctor is on leave."
                        + (
                            f" Reason: {reason}"
                            if reason
                            else ""
                        )
                        + "\n\nPlease book another available slot."
                    ),
                    status="pending",
                    attempts=0,
                    created_at=datetime.utcnow()
                )

                db.add(patient_notification)

                patient_notification_count += 1

    # -----------------------------------------------------
    # NOTIFY DOCTOR
    # -----------------------------------------------------

    if doctor_user:

        doctor_email = getattr(
            doctor_user,
            "email",
            None
        )

        if doctor_email:

            doctor_notification = Notification(
                user_id=doctor_user.id,
                notification_type="doctor_leave",
                recipient=doctor_email,
                subject="Doctor Leave Marked",
                body=(
                    f"You have been marked as on leave for "
                    f"{leave_date}."
                    + (
                        f" Reason: {reason}"
                        if reason
                        else ""
                    )
                    + f"\n\nAffected appointments: "
                    f"{len(affected_appointments)}"
                ),
                status="pending",
                attempts=0,
                created_at=datetime.utcnow()
            )

            db.add(doctor_notification)

    # -----------------------------------------------------
    # COMMIT EVERYTHING TOGETHER
    # -----------------------------------------------------

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to mark doctor leave"
        )

    return {
        "message": "Doctor marked on leave successfully",
        "doctor_id": doctor_id,
        "leave_date": leave_date,
        "affected_appointments": len(
            affected_appointments
        ),
        "patient_notifications_created": patient_notification_count
    }
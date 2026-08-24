
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.visit import Visit

from app.schemas.visit import (
    VisitCreate,
    VisitResponse
)

from app.services.llm_service import (
    generate_post_visit_summary
)


router = APIRouter(
    prefix="/visits",
    tags=["Visits"]
)


# ---------------------------------------------------------
# CREATE POST-VISIT SUMMARY
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=VisitResponse
)
def create_visit(
    request: VisitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # ONLY DOCTORS
    # -----------------------------------------------------

    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can submit visit notes"
        )

    # -----------------------------------------------------
    # FIND DOCTOR PROFILE
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
            detail="Doctor profile not found"
        )

    # -----------------------------------------------------
    # FIND APPOINTMENT
    # -----------------------------------------------------

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == request.appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    # -----------------------------------------------------
    # VERIFY DOCTOR OWNS APPOINTMENT
    # -----------------------------------------------------

    if appointment.doctor_id != doctor.id:
        raise HTTPException(
            status_code=403,
            detail="This appointment does not belong to you"
        )

    # -----------------------------------------------------
    # VALIDATE APPOINTMENT STATUS
    # -----------------------------------------------------

    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot record a visit for a cancelled appointment"
        )

    # -----------------------------------------------------
    # PREVENT DUPLICATE VISIT
    # -----------------------------------------------------

    existing_visit = (
        db.query(Visit)
        .filter(
            Visit.appointment_id == appointment.id
        )
        .first()
    )

    if existing_visit:
        raise HTTPException(
            status_code=400,
            detail="Visit already recorded for this appointment"
        )

    # -----------------------------------------------------
    # GENERATE AI SUMMARY
    # -----------------------------------------------------

    ai_summary = generate_post_visit_summary(
        request.clinical_notes,
        request.prescription
    )

    # -----------------------------------------------------
    # CREATE VISIT & MARK COMPLETED
    # -----------------------------------------------------

    visit = Visit(
        appointment_id=appointment.id,
        doctor_notes=request.clinical_notes,
        prescription=request.prescription,
        patient_summary=ai_summary
    )

    db.add(visit)

    # Mark appointment completed
    appointment.status = "completed"

    db.commit()
    db.refresh(visit)

    return visit


# ---------------------------------------------------------
# GET VISIT
# ---------------------------------------------------------

@router.get(
    "/{appointment_id}",
    response_model=VisitResponse
)
def get_visit(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

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
            detail="Appointment not found"
        )

    # -----------------------------------------------------
    # PATIENT ACCESS
    # -----------------------------------------------------

    if current_user.role == "patient":

        if appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not your appointment"
            )

    # -----------------------------------------------------
    # DOCTOR ACCESS
    # -----------------------------------------------------

    elif current_user.role == "doctor":

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
                detail="Doctor profile not found"
            )

        if appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="Not your appointment"
            )

    else:

        # Admin can view
        if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    # -----------------------------------------------------
    # GET VISIT
    # -----------------------------------------------------

    visit = (
        db.query(Visit)
        .filter(
            Visit.appointment_id == appointment_id
        )
        .first()
    )

    if not visit:
        raise HTTPException(
            status_code=404,
            detail="Visit notes not found"
        )

    return visit

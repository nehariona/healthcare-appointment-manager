import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.user import User
from app.models.appointment import Appointment
from app.models.symptom import Symptom

from app.schemas.symptom import (
    SymptomCreate,
    SymptomResponse
)

from app.services.llm_service import (
    generate_pre_visit_summary
)


router = APIRouter(
    prefix="/symptoms",
    tags=["Symptoms"]
)


def _decode_questions(value):
    if value is None:
        return None

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except (TypeError, ValueError):
            return [value]

    return [str(value)]


@router.post(
    "/",
    response_model=SymptomResponse
)
def submit_symptoms(
    request: SymptomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ---------------------------------------------
    # Only patients can submit symptoms
    # ---------------------------------------------

    if current_user.role != "patient":

        raise HTTPException(
            status_code=403,
            detail="Only patients can submit symptoms"
        )

    # ---------------------------------------------
    # Find appointment
    # ---------------------------------------------

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

    # ---------------------------------------------
    # Make sure appointment belongs to patient
    # ---------------------------------------------

    if appointment.patient_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="This is not your appointment"
        )

    # ---------------------------------------------
    # Don't allow cancelled appointments
    # ---------------------------------------------

    if appointment.status == "cancelled":

        raise HTTPException(
            status_code=400,
            detail="Cannot submit symptoms for a cancelled appointment"
        )

    # ---------------------------------------------
    # Check whether symptoms already exist
    # ---------------------------------------------

    existing = (
        db.query(Symptom)
        .filter(
            Symptom.appointment_id == request.appointment_id
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Symptoms already submitted for this appointment"
        )

    # ---------------------------------------------
    # Generate AI summary
    # ---------------------------------------------

    ai_result = generate_pre_visit_summary(
        request.symptoms
    )

    # ---------------------------------------------
    # Store result
    # ---------------------------------------------

    symptom = Symptom(
        appointment_id=request.appointment_id,
        symptoms=request.symptoms,
        urgency_level=ai_result["urgency_level"],
        chief_complaint=ai_result["chief_complaint"],
        suggested_questions=json.dumps(
            ai_result["suggested_questions"],
            ensure_ascii=False,
        ),
        ai_summary=ai_result["ai_summary"]
    )

    db.add(symptom)

    db.commit()

    db.refresh(symptom)

    return SymptomResponse(
        id=symptom.id,
        appointment_id=symptom.appointment_id,
        symptoms=symptom.symptoms,
        urgency_level=symptom.urgency_level,
        chief_complaint=symptom.chief_complaint,
        suggested_questions=_decode_questions(symptom.suggested_questions),
        ai_summary=symptom.ai_summary,
    )


# ---------------------------------------------------------
# GET SYMPTOMS FOR AN APPOINTMENT
# ---------------------------------------------------------

@router.get(
    "/appointment/{appointment_id}",
    response_model=SymptomResponse
)
def get_appointment_symptoms(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    # ---------------------------------------------
    # Patient can see their own symptoms
    # ---------------------------------------------

    if current_user.role == "patient":

        if appointment.patient_id != current_user.id:

            raise HTTPException(
                status_code=403,
                detail="Not your appointment"
            )

    # ---------------------------------------------
    # Doctor can see symptoms for their appointment
    # ---------------------------------------------

    elif current_user.role == "doctor":

        from app.models.doctor import Doctor

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

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # ---------------------------------------------
    # Get symptoms
    # ---------------------------------------------

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.appointment_id == appointment_id
        )
        .first()
    )

    if not symptom:

        raise HTTPException(
            status_code=404,
            detail="Symptoms not submitted"
        )

    return SymptomResponse(
        id=symptom.id,
        appointment_id=symptom.appointment_id,
        symptoms=symptom.symptoms,
        urgency_level=symptom.urgency_level,
        chief_complaint=symptom.chief_complaint,
        suggested_questions=_decode_questions(symptom.suggested_questions),
        ai_summary=symptom.ai_summary,
    )
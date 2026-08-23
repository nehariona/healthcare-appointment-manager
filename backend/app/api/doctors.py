from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.doctor import Doctor
from app.models.doctor_verification import DoctorVerification
from app.models.user import User

from app.schemas.doctor import (
    DoctorCreate,
    DoctorResponse
)


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


# =========================================================
# CREATE DOCTOR PROFILE
# =========================================================

@router.post(
    "/profile",
    response_model=DoctorResponse
)
def create_doctor_profile(
    data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Only doctors can create doctor profiles
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can create doctor profiles"
        )

    # Check if doctor profile already exists
    existing = (
        db.query(Doctor)
        .filter(
            Doctor.user_id == current_user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Doctor profile already exists"
        )

    # Create doctor profile
    doctor = Doctor(
        user_id=current_user.id,
        specialization=data.specialization,
        experience_years=data.experience_years,
        hospital=data.hospital,
        working_start=data.working_start,
        working_end=data.working_end,
        slot_duration=data.slot_duration
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "full_name": current_user.full_name,
        "specialization": doctor.specialization,
        "experience_years": doctor.experience_years,
        "hospital": doctor.hospital,
        "working_start": doctor.working_start,
        "working_end": doctor.working_end,
        "slot_duration": doctor.slot_duration,
        "is_active": doctor.is_active
    }


# =========================================================
# GET ALL DOCTORS
# =========================================================

@router.get(
    "/",
    response_model=list[DoctorResponse]
)
def get_doctors(
    db: Session = Depends(get_db)
):

    doctors = (
        db.query(
            Doctor,
            User.full_name
        )
        .join(
            User,
            Doctor.user_id == User.id
        )
        .filter(
            Doctor.is_active == True,
            User.role == "doctor"
        )
        .all()
    )

    return [
        {
            "id": doctor.id,
            "user_id": doctor.user_id,
            "full_name": full_name,
            "specialization": doctor.specialization,
            "experience_years": doctor.experience_years,
            "hospital": doctor.hospital,
            "working_start": doctor.working_start,
            "working_end": doctor.working_end,
            "slot_duration": doctor.slot_duration,
            "is_active": doctor.is_active
        }
        for doctor, full_name in doctors
    ]


# =========================================================
# GET MY DOCTOR PROFILE
# =========================================================

@router.get(
    "/me",
    response_model=DoctorResponse
)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Only doctors
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can access this profile"
        )

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
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )

        doctor = Doctor(
            user_id=current_user.id,
            specialization=verification.specialization,
            experience_years=verification.experience_years,
            hospital=verification.hospital,
            working_start="09:00:00",
            working_end="17:00:00",
            slot_duration=30,
            is_active=True,
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)

    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "full_name": current_user.full_name,
        "specialization": doctor.specialization,
        "experience_years": doctor.experience_years,
        "hospital": doctor.hospital,
        "working_start": doctor.working_start,
        "working_end": doctor.working_end,
        "slot_duration": doctor.slot_duration,
        "is_active": doctor.is_active
    }
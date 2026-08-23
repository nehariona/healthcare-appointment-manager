from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.models.doctor_verification import DoctorVerification

from app.repositories.user_repository import (
    get_user_by_email,
    create_user
)


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    role: str,
    government_id_number: str | None = None,
    medical_license_number: str | None = None,
    specialization: str | None = None,
    hospital: str | None = None,
    experience_years: int | None = None
):

    existing_user = get_user_by_email(
        db,
        email
    )

    if existing_user:
        return None

    password_hash = hash_password(password)

    user = create_user(
        db=db,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=role
    )

    if role == "patient":

        user.is_verified = True

    elif role == "doctor":

        verification = DoctorVerification(
            doctor_id=user.id,
            government_id_number=government_id_number,
            medical_license_number=medical_license_number,
            specialization=specialization,
            hospital=hospital,
            experience_years=experience_years,
            status="pending"
        )

        db.add(verification)

    db.commit()
    db.refresh(user)

    return user


def login_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    if user.role == "doctor" and not user.is_verified:

        raise PermissionError(
            "Doctor account is awaiting admin verification"
        )

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return token
from sqlalchemy.orm import Session

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.models.password_reset import PasswordResetToken
from app.services.email_service import send_email
from app.core.config import FRONTEND_URL

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

def request_password_reset(
    db: Session,
    email: str
):
    user = get_user_by_email(db, email)

    # Do not reveal whether the email exists
    if not user:
        return

    # Generate secure random token
    raw_token = secrets.token_urlsafe(32)

    # Store only the hash in database
    token_hash = hashlib.sha256(
        raw_token.encode()
    ).hexdigest()

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=15
    )

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False
    )

    db.add(reset_token)
    db.commit()

    reset_link = (
        "https://healthcare-appointment-manager-"
        "frontend-j9or.onrender.com/reset-password"
        f"?token={raw_token}"
    )

    send_email(
        recipient=user.email,
        subject="Healthcare Appointment Manager - Password Reset",
        body=f"""
Hello {user.full_name},

We received a request to reset your password.

Click the link below to reset your password:

{reset_link}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
Healthcare Appointment Manager
"""
    )


def reset_password(
    db: Session,
    token: str,
    new_password: str
):
    token_hash = hashlib.sha256(
        token.encode()
    ).hexdigest()

    reset_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False
        )
        .first()
    )

    if not reset_token:
        return False

    now = datetime.now(timezone.utc)

    if reset_token.expires_at < now:
        return False

    user = reset_token.user

    user.password_hash = hash_password(new_password)

    reset_token.used = True

    db.commit()

    return True
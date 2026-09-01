from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
)

from app.schemas.user import UserResponse

from app.services.auth_service import (
    register_user,
    login_user,
    request_password_reset,
    reset_password
)
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    if request.role not in ["patient", "doctor"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = register_user(
    db=db,
    email=request.email,
    password=request.password,
    full_name=request.full_name,
    role=request.role,
    government_id_number=request.government_id_number,
    medical_license_number=request.medical_license_number,
    specialization=request.specialization,
    hospital=request.hospital,
    experience_years=request.experience_years
)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return user
@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    try:
        token = login_user(
            db=db,
            email=request.email,
            password=request.password
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e)
        )

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    request_password_reset(
        db=db,
        email=request.email
    )

    return {
        "message": "If an account with that email exists, "
                   "a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password_endpoint(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    success = reset_password(
        db=db,
        token=request.token,
        new_password=request.new_password
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token"
        )

    return {
        "message": "Password reset successfully"
    }
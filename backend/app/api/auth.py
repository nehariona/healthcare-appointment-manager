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
    TokenResponse
)

from app.schemas.user import UserResponse

from app.services.auth_service import (
    register_user,
    login_user
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
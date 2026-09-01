from pydantic import BaseModel, EmailStr, model_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str

    specialization: str | None = None
    hospital: str | None = None
    experience_years: int | None = None
    government_id_number: str | None = None
    medical_license_number: str | None = None

    @model_validator(mode="after")
    def validate_doctor_details(self):

        if self.role == "doctor":

            if not self.specialization:
                raise ValueError("Specialization is required for doctors")

            if not self.hospital:
                raise ValueError("Hospital is required for doctors")

            if self.experience_years is None:
                raise ValueError("Experience years is required for doctors")

            if not self.government_id_number:
                raise ValueError("Government ID is required for doctors")

            if not self.medical_license_number:
                raise ValueError(
                    "Medical license number is required for doctors"
                )

        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
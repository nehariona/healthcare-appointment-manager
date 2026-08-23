from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):

    id: int

    email: EmailStr

    full_name: str

    role: str

    class Config:
        from_attributes = True
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.appointments import router as appointments_router
from app.api.auth import router as auth_router
from app.api.calendar import router as calendar_router
from app.api.doctors import router as doctors_router
from app.api.notifications import router as notifications_router
from app.api.symptoms import router as symptoms_router
from app.api.users import router as users_router
from app.api.visits import router as visits_router

from app.core.database import Base, engine

# Import all models so SQLAlchemy knows about all tables
from app.models import (
    Appointment,
    Doctor,
    DoctorLeave,
    DoctorVerification,
    Notification,
    Symptom,
    User,
    Visit,
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Healthcare Appointment Manager",
    version="1.0.0",
    description="Healthcare scheduling, patient intake, doctor workflows, and visit summaries.",
    docs_url="/docs",
    redoc_url="/redoc",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://healthcare-appointment-manager-frontend-j9or.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Healthcare Appointment Manager API",
        "status": "running",
        "version": "1.0.0",
    }


# =========================================================
# API ROUTES
# =========================================================

app.include_router(auth_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(symptoms_router)
app.include_router(visits_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(calendar_router)
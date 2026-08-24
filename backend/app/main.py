from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.doctors import router as doctors_router
from app.api.appointments import router as appointments_router
from app.api.admin import router as admin_router
from app.api.symptoms import router as symptoms_router
from app.api.visits import router as visits_router
from app.api.notifications import router as notifications_router
from app.api.users import router as users_router
from app.api.calendar import router as calendar_router


app = FastAPI(
    title="Healthcare Appointment Manager",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://healthcare-appointment-manager-w3ap.onrender.com",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(admin_router)
app.include_router(symptoms_router)
app.include_router(visits_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(calendar_router)
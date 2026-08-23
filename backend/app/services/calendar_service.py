from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)


# =========================================================
# TIMEZONE
# =========================================================

IST = ZoneInfo("Asia/Kolkata")


# =========================================================
# GOOGLE CALENDAR SCOPES
# =========================================================

GOOGLE_CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events"
]


# =========================================================
# BUILD GOOGLE CALENDAR SERVICE
# =========================================================

def build_calendar_service(
    access_token: str,
    refresh_token: str | None = None,
):

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=GOOGLE_CALENDAR_SCOPES,
    )

    return build(
        "calendar",
        "v3",
        credentials=credentials,
    )


# =========================================================
# BUILD SERVICE FOR USER
# =========================================================

def build_calendar_service_for_user(user):

    if not user.google_access_token:
        raise ValueError(
            "Google Calendar is not connected"
        )

    return build_calendar_service(
        access_token=user.google_access_token,
        refresh_token=user.google_refresh_token,
    )


# =========================================================
# NORMALIZE DATETIME TO IST
# =========================================================

def normalize_to_ist(
    appointment_time: datetime,
) -> datetime:

    if appointment_time is None:
        return appointment_time

    # If datetime has no timezone,
    # assume it is already IST.
    if appointment_time.tzinfo is None:
        return appointment_time.replace(
            tzinfo=IST
        )

    # If timezone exists, convert to IST.
    return appointment_time.astimezone(IST)


# =========================================================
# CREATE CALENDAR EVENT
# =========================================================

def create_calendar_event(
    service,
    appointment_time: datetime,
    doctor_name: str,
    patient_name: str,
    patient_email: str,
    doctor_email: str,
    reason: str | None = None,
):

    # -----------------------------------------------------
    # Normalize appointment time
    # -----------------------------------------------------

    appointment_time = normalize_to_ist(
        appointment_time
    )

    # -----------------------------------------------------
    # Appointment duration
    # -----------------------------------------------------

    end_time = (
        appointment_time
        + timedelta(minutes=30)
    )

    # -----------------------------------------------------
    # Google Calendar Event
    # -----------------------------------------------------

    event = {

        "summary": (
            f"Doctor Appointment - Dr. {doctor_name}"
        ),

        "description": (
            f"Patient: {patient_name}\n"
            f"Patient Email: {patient_email}\n"
            f"Doctor: {doctor_name}\n"
            f"Doctor Email: {doctor_email}\n"
            f"Reason: {reason or 'Not specified'}"
        ),

        "start": {
            "dateTime": appointment_time.isoformat(),
            "timeZone": "Asia/Kolkata",
        },

        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Asia/Kolkata",
        },

        "attendees": [
            {
                "email": patient_email,
            },
            {
                "email": doctor_email,
            },
        ],

        "reminders": {
            "useDefault": False,

            "overrides": [
                {
                    "method": "email",
                    "minutes": 60,
                },
                {
                    "method": "popup",
                    "minutes": 30,
                },
            ],
        },
    }

    # -----------------------------------------------------
    # Create event
    # -----------------------------------------------------

    return (
        service.events()
        .insert(
            calendarId="primary",
            body=event,
            sendUpdates="all",
        )
        .execute()
    )


# =========================================================
# UPDATE CALENDAR EVENT
# =========================================================

def update_calendar_event(
    service,
    event_id: str,
    appointment_time: datetime,
    doctor_name: str | None = None,
    patient_name: str | None = None,
    patient_email: str | None = None,
    doctor_email: str | None = None,
    reason: str | None = None,
):

    # -----------------------------------------------------
    # Normalize appointment time
    # -----------------------------------------------------

    appointment_time = normalize_to_ist(
        appointment_time
    )

    # -----------------------------------------------------
    # Calculate end time
    # -----------------------------------------------------

    end_time = (
        appointment_time
        + timedelta(minutes=30)
    )

    # -----------------------------------------------------
    # Base update
    # -----------------------------------------------------

    body = {

        "start": {
            "dateTime": appointment_time.isoformat(),
            "timeZone": "Asia/Kolkata",
        },

        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Asia/Kolkata",
        },
    }

    # -----------------------------------------------------
    # Update event title
    # -----------------------------------------------------

    if doctor_name:

        body["summary"] = (
            f"Doctor Appointment - Dr. {doctor_name}"
        )

    # -----------------------------------------------------
    # Update description
    # -----------------------------------------------------

    if any([
        doctor_name,
        patient_name,
        patient_email,
        doctor_email,
        reason,
    ]):

        body["description"] = (
            f"Patient: {patient_name or 'Patient'}\n"
            f"Patient Email: {patient_email or 'N/A'}\n"
            f"Doctor: {doctor_name or 'Doctor'}\n"
            f"Doctor Email: {doctor_email or 'N/A'}\n"
            f"Reason: {reason or 'Not specified'}"
        )

    # -----------------------------------------------------
    # Update attendees
    # -----------------------------------------------------

    if patient_email or doctor_email:

        attendees = []

        if patient_email:

            attendees.append({
                "email": patient_email,
            })

        if doctor_email:

            attendees.append({
                "email": doctor_email,
            })

        body["attendees"] = attendees

    # -----------------------------------------------------
    # Update Google Calendar event
    # -----------------------------------------------------

    return (
        service.events()
        .patch(
            calendarId="primary",
            eventId=event_id,
            body=body,
            sendUpdates="all",
        )
        .execute()
    )


# =========================================================
# DELETE CALENDAR EVENT
# =========================================================

def delete_calendar_event(
    service,
    event_id: str,
):

    return (
        service.events()
        .delete(
            calendarId="primary",
            eventId=event_id,
            sendUpdates="all",
        )
        .execute()
    )


# =========================================================
# FORMAT IST DATETIME
# =========================================================

def format_ist_datetime(
    appointment_time: datetime,
) -> str:

    if appointment_time is None:
        return "N/A"

    appointment_time = normalize_to_ist(
        appointment_time
    )

    return appointment_time.strftime(
        "%d %B %Y, %I:%M %p IST"
    )
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
    """
    Create an authenticated Google Calendar API service.
    """

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
# BUILD SERVICE FOR APPLICATION USER
# =========================================================

def build_calendar_service_for_user(user):
    """
    Build Google Calendar service using the
    Google tokens stored for the application user.
    """

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
    """
    Convert datetime to Asia/Kolkata.

    If datetime is naive, assume it is already IST.
    """

    if appointment_time.tzinfo is None:

        return appointment_time.replace(
            tzinfo=IST
        )

    return appointment_time.astimezone(
        IST
    )


# =========================================================
# CREATE GOOGLE CALENDAR EVENT
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
    """
    Create a Google Calendar event for an appointment.
    """

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
    # Event
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

        "attendees": [],

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
    # Add patient
    # -----------------------------------------------------

    if patient_email:

        event["attendees"].append(
            {
                "email": patient_email
            }
        )

    # -----------------------------------------------------
    # Add doctor
    # -----------------------------------------------------

    if doctor_email:

        event["attendees"].append(
            {
                "email": doctor_email
            }
        )

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
# UPDATE GOOGLE CALENDAR EVENT
# =========================================================

def update_calendar_event(
    service,
    event_id: str,
    appointment_time: datetime,
    doctor_name: str | None = None,
    patient_name: str | None = None,
    reason: str | None = None,
):
    """
    Update an existing Google Calendar event.

    Primarily used when an appointment is rescheduled.
    """

    # -----------------------------------------------------
    # Normalize time
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
    # Event update body
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
    # Update summary if doctor name exists
    # -----------------------------------------------------

    if doctor_name:

        body["summary"] = (
            f"Doctor Appointment - Dr. {doctor_name}"
        )

    # -----------------------------------------------------
    # Update description
    # -----------------------------------------------------

    description_parts = []

    if patient_name:

        description_parts.append(
            f"Patient: {patient_name}"
        )

    if reason:

        description_parts.append(
            f"Reason: {reason}"
        )

    if description_parts:

        body["description"] = (
            "\n".join(description_parts)
        )

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
# DELETE GOOGLE CALENDAR EVENT
# =========================================================

def delete_calendar_event(
    service,
    event_id: str,
):
    """
    Delete an existing Google Calendar event.
    """

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
    """
    Convert datetime into human-readable IST format.

    Example:
    23 August 2026, 03:30 PM IST
    """

    if appointment_time is None:

        return "N/A"

    appointment_time = normalize_to_ist(
        appointment_time
    )

    return appointment_time.strftime(
        "%d %B %Y, %I:%M %p IST"
    )

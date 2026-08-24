import os
from pathlib import Path
from typing import List, Union

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# ---------------------------------------------------------
# RELIABLE .ENV DISCOVERY
# ---------------------------------------------------------

_CURRENT_FILE = Path(__file__).resolve()
_CORE_DIR = _CURRENT_FILE.parent
_APP_DIR = _CORE_DIR.parent
_BACKEND_DIR = _APP_DIR.parent
_REPO_ROOT = _BACKEND_DIR.parent

_ENV_CANDIDATES = [
    _REPO_ROOT / ".env",
    _BACKEND_DIR / ".env",
    Path.cwd() / ".env",
]

_ACTIVE_ENV_FILE = None
for _candidate in _ENV_CANDIDATES:
    if _candidate.is_file():
        load_dotenv(_candidate, override=False)
        _ACTIVE_ENV_FILE = _candidate
        break


class Settings(BaseSettings):

    # ---------------------------------------------------------
    # DATABASE
    # ---------------------------------------------------------

    database_url: str

    # ---------------------------------------------------------
    # JWT
    # ---------------------------------------------------------

    secret_key: str

    algorithm: str = "HS256"

    access_token_expire_minutes: int = 30

    # ---------------------------------------------------------
    # GROQ / LLM
    # ---------------------------------------------------------

    groq_api_key: str

    # ---------------------------------------------------------
    # EMAIL / SMTP
    # ---------------------------------------------------------

    smtp_host: str = "smtp.gmail.com"

    smtp_port: int = 587

    smtp_username: str

    smtp_password: str

    # ---------------------------------------------------------
    # GOOGLE CALENDAR
    # ---------------------------------------------------------

    google_client_id: str

    google_client_secret: str

    google_redirect_uri: str = (
        "http://127.0.0.1:8000/calendar/oauth/callback"
    )

    # ---------------------------------------------------------
    # CORS / FRONTEND ORIGINS
    # ---------------------------------------------------------

    allowed_origins: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://healthcare-appointment-manager-w3ap.onrender.com",
    ]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.allowed_origins, str):
            return [
                origin.strip()
                for origin in self.allowed_origins.split(",")
                if origin.strip()
            ]
        return self.allowed_origins

    # ---------------------------------------------------------
    # SETTINGS CONFIG
    # ---------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=str(_ACTIVE_ENV_FILE) if _ACTIVE_ENV_FILE else None,
        extra="ignore"
    )


settings = Settings()


# ---------------------------------------------------------
# BACKWARD COMPATIBILITY
# ---------------------------------------------------------

DATABASE_URL = settings.database_url

SECRET_KEY = settings.secret_key

ALGORITHM = settings.algorithm

ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.access_token_expire_minutes
)

GROQ_API_KEY = settings.groq_api_key


# ---------------------------------------------------------
# EMAIL / SMTP
# ---------------------------------------------------------

SMTP_HOST = settings.smtp_host

SMTP_PORT = settings.smtp_port

SMTP_USERNAME = settings.smtp_username

SMTP_PASSWORD = settings.smtp_password


# ---------------------------------------------------------
# GOOGLE CALENDAR
# ---------------------------------------------------------

GOOGLE_CLIENT_ID = settings.google_client_id

GOOGLE_CLIENT_SECRET = settings.google_client_secret

GOOGLE_REDIRECT_URI = settings.google_redirect_uri

ALLOWED_ORIGINS = settings.cors_origins_list

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


load_dotenv("../.env")


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
    # SETTINGS CONFIG
    # ---------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file="../.env",
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

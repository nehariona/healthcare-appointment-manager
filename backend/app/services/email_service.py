import smtplib
from email.message import EmailMessage

from app.core.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
)


def send_email(
    recipient: str,
    subject: str,
    body: str,
):
    """
    Sends an email using SMTP.
    """

    message = EmailMessage()

    message["From"] = SMTP_USERNAME
    message["To"] = recipient
    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:

        server.starttls() #secure the connection by encryption

        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD,
        )

        server.send_message(message)
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.notification import Notification


# =========================================================
# CREATE NOTIFICATION
# =========================================================

def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    recipient: str,
    subject: str,
    body: str
) -> Notification:
    """
    Creates a notification record in the database.

    The notification starts with status = pending.

    Email delivery can be performed separately by a
    background worker / email service.
    """

    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        recipient=recipient,
        subject=subject,
        body=body,
        status="pending",
        attempts=0,
        last_error=None,
        created_at=datetime.utcnow(),
        sent_at=None
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# =========================================================
# MARK NOTIFICATION AS SENT
# =========================================================

def mark_notification_sent(
    db: Session,
    notification: Notification
) -> Notification:

    notification.status = "sent"

    notification.sent_at = datetime.utcnow()

    notification.last_error = None

    db.commit()
    db.refresh(notification)

    return notification


# =========================================================
# MARK NOTIFICATION AS FAILED
# =========================================================

def mark_notification_failed(
    db: Session,
    notification: Notification,
    error_message: str
) -> Notification:

    notification.status = "failed"

    notification.attempts += 1

    notification.last_error = error_message

    db.commit()
    db.refresh(notification)

    return notification


# =========================================================
# GET PENDING NOTIFICATIONS
# =========================================================

def get_pending_notifications(
    db: Session,
    limit: int = 50
):
    """
    Returns pending notifications that can be processed
    by a background worker.
    """

    return (
        db.query(Notification)
        .filter(
            Notification.status == "pending"
        )
        .order_by(
            Notification.created_at.asc()
        )
        .limit(limit)
        .all()
    )


# =========================================================
# GET FAILED NOTIFICATIONS FOR RETRY
# =========================================================

def get_failed_notifications(
    db: Session,
    max_attempts: int = 3,
    limit: int = 50
):
    """
    Returns failed notifications that have not exceeded
    the retry limit.
    """

    return (
        db.query(Notification)
        .filter(
            Notification.status == "failed",
            Notification.attempts < max_attempts
        )
        .order_by(
            Notification.created_at.asc()
        )
        .limit(limit)
        .all()
    )

from app.services.email_service import send_email


def process_notification(
    db: Session,
    notification: Notification
):
    """
    Attempts to send a pending notification by email.
    """

    try:
        send_email(
            recipient=notification.recipient,
            subject=notification.subject,
            body=notification.body
        )

        return mark_notification_sent(
            db,
            notification
        )

    except Exception as e:

        return mark_notification_failed(
            db,
            notification,
            str(e)
        )
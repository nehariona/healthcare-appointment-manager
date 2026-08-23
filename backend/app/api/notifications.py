from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user

from app.models.user import User
from app.models.notification import Notification

from app.schemas.notification import NotificationResponse


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# =========================================================
# GET MY NOTIFICATIONS
# =========================================================

@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications

# =========================================================
# GET PENDING NOTIFICATIONS
# =========================================================

@router.get(
    "/status/pending",
    response_model=list[NotificationResponse]
)
def get_pending_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only admin can inspect pending notifications
    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Only admins can access pending notifications"
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.status == "pending"
        )
        .order_by(
            Notification.created_at.asc()
        )
        .all()
    )

    return notifications


# =========================================================
# GET FAILED NOTIFICATIONS
# =========================================================

@router.get(
    "/status/failed",
    response_model=list[NotificationResponse]
)
def get_failed_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only admin can inspect failed notifications
    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Only admins can access failed notifications"
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.status == "failed"
        )
        .order_by(
            Notification.created_at.asc()
        )
        .all()
    )

    return notifications
# =========================================================
# GET SINGLE NOTIFICATION
# =========================================================

@router.get(
    "/{notification_id}",
    response_model=NotificationResponse
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notification:

        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    # -----------------------------------------------------
    # SECURITY CHECK
    # -----------------------------------------------------

    if notification.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="Not your notification"
        )

    return notification



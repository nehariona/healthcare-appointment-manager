function NotificationCard({
  notification,
}) {
  return (
    <div className="notification-card">

      <div className="notification-icon">
        !
      </div>

      <div>

        <h3>
          {notification.subject ||
            notification.notification_type ||
            "Notification"}
        </h3>

        <p>
          {notification.body ||
            "No message"}
        </p>

      </div>

    </div>
  );
}

export default NotificationCard;

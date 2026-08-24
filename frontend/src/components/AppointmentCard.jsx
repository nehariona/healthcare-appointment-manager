function AppointmentCard({
  appointment,
  onCancel,
  onReschedule,
}) {
  return (
    <div className="appointment-card">

      <div className="appointment-main">

        <div className="appointment-avatar">
          {(
            appointment.doctor_name ||
            "D"
          )
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>

          <h3>
            Dr.{" "}
            {appointment.doctor_name ||
              "Doctor"}
          </h3>

          <p>
            {appointment.appointment_time_ist}
          </p>

          <p>
            {appointment.reason ||
              "No reason specified"}
          </p>

        </div>

      </div>

      <div className="appointment-actions">

        <span
          className={`status ${appointment.status}`}
        >
          {appointment.status}
        </span>

        {appointment.status !== "cancelled" &&
          appointment.status !== "completed" && (
          <>
            {onReschedule && (
              <button
                className="secondary-btn"
                onClick={() =>
                  onReschedule(
                    appointment
                  )
                }
              >
                Reschedule
              </button>
            )}

            {onCancel && (
              <button
                className="danger-btn"
                onClick={() =>
                  onCancel(
                    appointment.appointment_id || appointment.id
                  )
                }
              >
                Cancel
              </button>
            )}
          </>
        )}

      </div>

    </div>
  );
}

export default AppointmentCard;

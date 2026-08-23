import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Stethoscope,
  UserRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  getAvailableSlots,
  bookAppointment,
} from "../../api/api";

function BookAppointment({
  doctor,
  onBack,
  onBooked,
}) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!date || !doctor) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    loadSlots();
  }, [date, doctor]);

  async function loadSlots() {
    try {
      setLoading(true);
      setError("");
      setSelectedSlot(null);

      const doctorId =
        doctor?.doctor_id || doctor?.id;

      const response = await getAvailableSlots(
        doctorId,
        date
      );

      setSlots(response || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load available slots."
      );

      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBooking() {
    if (!selectedSlot) {
      setError(
        "Please select an appointment time."
      );
      return;
    }

    try {
      setBooking(true);
      setError("");
      setSuccess("");

      await bookAppointment({
        doctor_id:
          doctor?.doctor_id || doctor?.id,

        appointment_time:
          selectedSlot.appointment_time,

        reason:
          reason.trim() || null,
      });

      setSuccess(
        "Your appointment has been booked successfully."
      );

      setSelectedSlot(null);
      setReason("");

      if (onBooked) {
        setTimeout(() => {
          onBooked();
        }, 1200);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to book appointment."
      );
    } finally {
      setBooking(false);
    }
  }

  function formatTime(value) {
    if (!value) return "";

    return new Date(value).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  }

  function formatSelectedDate(value) {
    if (!value) return "";

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const doctorName =
    doctor?.name ||
    doctor?.full_name ||
    doctor?.doctor_name ||
    "Doctor";

  const specialization =
    doctor?.specialization ||
    doctor?.specialty ||
    "General Medicine";

  const doctorInitial =
    doctorName.charAt(0).toUpperCase();

  const today = new Date()
    .toISOString()
    .split("T")[0];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8">

          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            <ArrowLeft size={17} />
            Back to Doctors
          </button>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <CalendarDays size={19} />
            </div>

            <div>

              <span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                Appointment
              </span>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Book an Appointment
              </h1>

            </div>

          </div>

          <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Select a date and available time that works
            best for you.
          </p>

        </div>


        {/* DOCTOR */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="flex items-center gap-4 p-6">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {doctorInitial}
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Appointment with
              </p>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {doctorName}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Stethoscope size={15} />
                {specialization}
              </div>

            </div>

          </div>

        </section>


        {/* STEP 1 - DATE */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

            <div className="flex items-center gap-3">

              <StepNumber number="1" />

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Select Date
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Choose when you'd like to visit.
                </p>
              </div>

            </div>

          </div>

          <div className="p-6">

            <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Appointment date
            </label>

            <div className="relative max-w-md">

              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400"
              />

              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
              />

            </div>

            {date && (
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                <Check size={16} />
                {formatSelectedDate(date)}
              </div>
            )}

          </div>

        </section>


        {/* STEP 2 - TIME */}

        {date && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <StepNumber number="2" />

                <div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Select Time
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Choose an available appointment slot.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-6">

              {loading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                  {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                      />
                    )
                  )}

                </div>
              )}

              {!loading && slots.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Clock3 size={22} />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                    No available times
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                    This doctor has no available appointment
                    slots on this date. Please choose another
                    date.
                  </p>

                </div>
              )}

              {!loading && slots.length > 0 && (
                <div>

                  <div className="mb-4 flex items-center justify-between">

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {slots.length} available{" "}
                      {slots.length === 1
                        ? "slot"
                        : "slots"}
                    </p>

                    {selectedSlot && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <Check size={14} />
                        Time selected
                      </span>
                    )}

                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                    {slots.map((slot, index) => {

                      const selected =
                        selectedSlot?.appointment_time ===
                        slot.appointment_time;

                      return (
                        <button
                          type="button"
                          key={
                            slot.appointment_time ||
                            index
                          }
                          onClick={() => {
                            setSelectedSlot(slot);
                            setError("");
                          }}
                          className={`relative flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                          }`}
                        >

                          <Clock3 size={15} />

                          {formatTime(
                            slot.appointment_time
                          )}

                          {selected && (
                            <span className="absolute right-2 top-2">
                              <Check size={12} />
                            </span>
                          )}

                        </button>
                      );
                    })}

                  </div>

                </div>
              )}

            </div>

          </section>
        )}


        {/* STEP 3 */}

        {selectedSlot && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <StepNumber number="3" />

                <div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Visit Details
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Tell the doctor what you'd like to discuss.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-6">

              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <FileText size={14} />
                Reason for visit
                <span className="font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                rows="4"
                placeholder="Briefly describe the reason for your appointment..."
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
              />

              <p className="mt-2 text-[11px] text-slate-400">
                Avoid including sensitive information that
                isn't necessary for your appointment.
              </p>

            </div>

          </section>
        )}


        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />

            <div>

              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                {error}
              </p>

            </div>

          </div>
        )}


        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <div>

              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Appointment confirmed
              </p>

              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                {success}
              </p>

            </div>

          </div>
        )}


        {/* APPOINTMENT SUMMARY */}

        {selectedSlot && (
          <section className="sticky bottom-4 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl shadow-slate-900/10 dark:border-blue-500/20 dark:bg-slate-900">

            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">

              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Appointment Summary
              </p>

            </div>

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="grid gap-4 sm:grid-cols-3">

                <SummaryItem
                  icon={UserRound}
                  label="Doctor"
                  value={doctorName}
                />

                <SummaryItem
                  icon={CalendarDays}
                  label="Date"
                  value={formatSelectedDate(date)}
                />

                <SummaryItem
                  icon={Clock3}
                  label="Time"
                  value={formatTime(
                    selectedSlot.appointment_time
                  )}
                />

              </div>

              <button
                type="button"
                disabled={booking}
                onClick={handleBooking}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >

                {booking ? (
                  <>
                    <Clock3
                      size={17}
                      className="animate-spin"
                    />
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Appointment
                    <Check size={17} />
                  </>
                )}

              </button>

            </div>

          </section>
        )}

      </div>
    </div>
  );
}


/* ============================================
   STEP NUMBER
============================================ */

function StepNumber({ number }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      {number}
    </div>
  );
}


/* ============================================
   SUMMARY ITEM
============================================ */

function SummaryItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={16} />
      </div>

      <div className="min-w-0">

        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 max-w-[180px] truncate text-xs font-bold text-slate-800 dark:text-slate-200">
          {value}
        </p>

      </div>

    </div>
  );
}

export default BookAppointment;
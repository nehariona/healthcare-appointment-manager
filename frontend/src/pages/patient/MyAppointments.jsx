import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Mail,
  RefreshCw,
  Stethoscope,
  UserRound,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Ban,
  Eye,
  Plus,
  Sparkles,
} from "lucide-react";

import {
  createSymptoms,
  getMyAppointments,
  getAppointmentSymptoms,
  getVisit,
  cancelAppointment,
} from "../../api/api";


/* =========================================================
   HELPERS
========================================================= */

function getAppointmentId(appointment) {
  return (
    appointment?.appointment_id ??
    appointment?.id ??
    null
  );
}


function getDoctorName(appointment) {
  return (
    appointment?.doctor_name ||
    appointment?.doctor?.name ||
    appointment?.doctor?.full_name ||
    "Doctor"
  );
}


function getStatus(status) {
  return (
    String(status || "scheduled")
      .toLowerCase()
      .replace(/_/g, " ")
  );
}


function isCancelled(appointment) {
  const status = getStatus(appointment?.status);

  return (
    status === "cancelled" ||
    status === "canceled"
  );
}


function isCompleted(appointment) {
  return getStatus(appointment?.status) === "completed";
}


function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function formatTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


function getAppointmentDateTime(appointment) {
  return (
    appointment?.appointment_time ||
    appointment?.appointment_time_ist ||
    appointment?.date_time ||
    appointment?.datetime ||
    appointment?.scheduled_at ||
    null
  );
}


function getStatusStyle(status) {
  const value = getStatus(status);

  if (value === "completed") {
    return {
      wrapper:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      icon: CheckCircle2,
    };
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return {
      wrapper:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
      icon: Ban,
    };
  }

  return {
    wrapper:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    icon: CheckCircle2,
  };
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);


  /* =======================================================
     PRE-VISIT
  ======================================================= */

  const [symptomsMap, setSymptomsMap] = useState({});

  const [preVisitAppointment, setPreVisitAppointment] =
    useState(null);

  const [preVisitText, setPreVisitText] =
    useState("");

  const [preVisitViewAppointment, setPreVisitViewAppointment] =
    useState(null);


  /* =======================================================
     POST-VISIT
  ======================================================= */

  const [visitMap, setVisitMap] = useState({});

  const [postVisitAppointment, setPostVisitAppointment] =
    useState(null);


  /* =======================================================
     LOAD APPOINTMENTS
  ======================================================= */

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAppointments();

      const appointmentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
        ? data.appointments
        : [];

      setAppointments(appointmentList);

      await loadAppointmentDetails(
        appointmentList
      );

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     LOAD PRE-VISIT + POST-VISIT DATA
  ======================================================= */

  async function loadAppointmentDetails(
    appointmentList
  ) {
    const newSymptomsMap = {};
    const newVisitMap = {};

    const completedAppointments =
      appointmentList.filter(
        (appointment) =>
          isCompleted(appointment)
      );

    await Promise.all(
      appointmentList.map(
        async (appointment) => {
          const appointmentId =
            getAppointmentId(appointment);

          if (!appointmentId) {
            return;
          }

          /*
           * PRE-VISIT SUMMARY
           */

          try {
            const symptomResponse =
              await getAppointmentSymptoms(
                appointmentId
              );

            if (symptomResponse) {
              const symptoms =
                symptomResponse?.symptoms ??
                symptomResponse?.data?.symptoms ??
                symptomResponse;

              if (
                symptoms &&
                typeof symptoms === "object" &&
                !Array.isArray(symptoms)
              ) {
                newSymptomsMap[
                  appointmentId
                ] = symptoms;
              } else if (
                typeof symptoms === "string" &&
                symptoms.trim()
              ) {
                newSymptomsMap[
                  appointmentId
                ] = {
                  symptoms,
                };
              }
            }

          } catch (error) {
            /*
             * 404 usually means that no pre-visit
             * summary has been submitted yet.
             *
             * We deliberately don't show an error
             * for that case.
             */
          }


          /*
           * POST-VISIT SUMMARY
           */

          if (
            completedAppointments.includes(
              appointment
            )
          ) {
            try {
              const visitResponse =
                await getVisit(
                  appointmentId
                );

              if (visitResponse) {
                newVisitMap[
                  appointmentId
                ] = visitResponse;
              }

            } catch (error) {
              /*
               * No visit recorded yet.
               */
            }
          }
        }
      )
    );

    setSymptomsMap(newSymptomsMap);
    setVisitMap(newVisitMap);
  }


  useEffect(() => {
    loadAppointments();
  }, []);


  /* =======================================================
     CANCEL
  ======================================================= */

  async function handleCancel(
    appointmentId
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await cancelAppointment(
        appointmentId
      );

      await loadAppointments();

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to cancel appointment."
      );

    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     OPEN PRE-VISIT FORM
  ======================================================= */

  function openPreVisitForm(
    appointment
  ) {
    const appointmentId =
      getAppointmentId(appointment);

    if (
      symptomsMap[appointmentId]
    ) {
      setPreVisitViewAppointment(
        appointment
      );

      return;
    }

    setError("");

    setPreVisitText("");

    setPreVisitAppointment(
      appointment
    );
  }


  /* =======================================================
     SUBMIT PRE-VISIT
     ONLY ONCE
  ======================================================= */

  async function handlePreVisitSubmit() {
    if (!preVisitAppointment) {
      return;
    }

    const appointmentId =
      getAppointmentId(
        preVisitAppointment
      );

    if (!appointmentId) {
      setError(
        "Invalid appointment."
      );

      return;
    }

    if (!preVisitText.trim()) {
      setError(
        "Please describe your symptoms before submitting the pre-visit summary."
      );

      return;
    }

    /*
     * Prevent duplicate submission.
     */

    if (
      symptomsMap[appointmentId]
    ) {
      setError(
        "A pre-visit summary has already been submitted for this appointment."
      );

      setPreVisitAppointment(null);

      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await createSymptoms({
          appointment_id:
            appointmentId,

          symptoms:
            preVisitText.trim(),
        });


      /*
       * Immediately store the submitted
       * summary locally so the button changes
       * to VIEW PRE-VISIT SUMMARY.
       */

      setSymptomsMap(
        (current) => ({
          ...current,

          [appointmentId]:
            response || {
              appointment_id:
                appointmentId,

              symptoms:
                preVisitText.trim(),
            },
        })
      );

      setPreVisitAppointment(null);

      setPreVisitText("");

      await loadAppointments();

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to submit pre-visit summary."
      );

    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     GET SYMPTOM TEXT
  ======================================================= */

  function getSymptomsText(
    appointmentId
  ) {
    const data =
      symptomsMap[appointmentId];

    if (!data) {
      return "";
    }

    if (
      typeof data === "string"
    ) {
      return data;
    }

    return (
      data?.symptoms ||
      data?.summary ||
      data?.description ||
      data?.text ||
      ""
    );
  }


  /* =======================================================
     GET VISIT FIELDS
  ======================================================= */

  function getVisitValue(
    visit,
    fields
  ) {
    if (!visit) {
      return "";
    }

    for (const field of fields) {
      if (
        visit[field] !==
          undefined &&
        visit[field] !== null &&
        visit[field] !== ""
      ) {
        return visit[field];
      }
    }

    return "";
  }


  /* =======================================================
     STATS
  ======================================================= */

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        !isCancelled(appointment) &&
        !isCompleted(appointment)
    ).length;

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        isCompleted(appointment)
    ).length;

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        isCancelled(appointment)
    ).length;


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-slate-50
          px-4 py-6
          dark:bg-slate-950
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-6xl">

          <div className="mb-8">
            <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummarySkeleton />
            <SummarySkeleton />
            <SummarySkeleton />
          </div>

          <div className="mt-8 space-y-4">
            <AppointmentSkeleton />
            <AppointmentSkeleton />
            <AppointmentSkeleton />
          </div>

        </div>
      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        px-4 py-6
        text-slate-900
        dark:bg-slate-950
        dark:text-white
        sm:px-6
        lg:px-8
      "
    >

      <div className="mx-auto max-w-6xl">


        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            mb-8
            flex flex-col gap-5
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-xl
                  bg-blue-600
                  text-white
                  shadow-sm
                "
              >
                <CalendarDays size={18} />
              </div>

              <span
                className="
                  text-xs font-bold
                  uppercase
                  tracking-[0.14em]
                  text-blue-600
                  dark:text-blue-400
                "
              >
                Appointments
              </span>

            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
                dark:text-white
              "
            >
              My appointments
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Manage your appointments, share
              pre-visit information, and view
              your post-visit summaries.
            </p>

          </div>


          <button
            type="button"
            disabled={loading}
            onClick={loadAppointments}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-xs
              font-bold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
              disabled:opacity-50
              dark:border-slate-800
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            <RefreshCw size={14} />

            Refresh
          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              text-red-700
              dark:border-red-500/20
              dark:bg-red-500/10
              dark:text-red-300
            "
          >

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="
                text-red-400
                hover:text-red-700
                dark:hover:text-red-200
              "
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div
          className="
            mb-8
            grid
            gap-4
            sm:grid-cols-3
          "
        >

          <SummaryCard
            icon={CalendarDays}
            label="Upcoming"
            value={upcomingAppointments}
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={completedAppointments}
          />

          <SummaryCard
            icon={Ban}
            label="Cancelled"
            value={cancelledAppointments}
          />

        </div>


        {/* =================================================
            EMPTY
        ================================================= */}

        {appointments.length === 0 ? (
          <EmptyAppointments />
        ) : (

          <div className="space-y-4">

            {appointments.map(
              (appointment) => {

                const appointmentId =
                  getAppointmentId(
                    appointment
                  );

                const doctorName =
                  getDoctorName(
                    appointment
                  );

                const status =
                  getStatus(
                    appointment.status
                  );

                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const StatusIcon =
                  statusStyle.icon;

                const completed =
                  isCompleted(
                    appointment
                  );

                const cancelled =
                  isCancelled(
                    appointment
                  );

                const hasPreVisit =
                  Boolean(
                    symptomsMap[
                      appointmentId
                    ]
                  );

                const hasPostVisit =
                  Boolean(
                    visitMap[
                      appointmentId
                    ]
                  );

                const appointmentDateTime =
                  getAppointmentDateTime(
                    appointment
                  );

                return (
                  <article
                    key={
                      appointmentId ??
                      `appointment-${Math.random()}`
                    }
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-sm
                      dark:border-slate-800
                      dark:bg-slate-900
                    "
                  >

                    <div className="p-5 sm:p-6">

                      {/* =================================
                          TOP
                      ================================= */}

                      <div
                        className="
                          flex
                          flex-col
                          gap-4
                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                        "
                      >

                        <div
                          className="
                            flex
                            min-w-0
                            items-start
                            gap-4
                          "
                        >

                          <div
                            className="
                              flex
                              h-12
                              w-12
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              text-blue-600
                              dark:bg-blue-500/10
                              dark:text-blue-400
                            "
                          >
                            <Stethoscope
                              size={20}
                            />
                          </div>


                          <div className="min-w-0">

                            <h2
                              className="
                                truncate
                                text-base
                                font-bold
                                text-slate-900
                                dark:text-white
                              "
                            >
                              Dr. {doctorName}
                            </h2>


                            <div
                              className="
                                mt-2
                                flex
                                flex-wrap
                                items-center
                                gap-x-4
                                gap-y-2
                                text-xs
                                text-slate-500
                                dark:text-slate-400
                              "
                            >

                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays
                                  size={14}
                                />

                                {formatDate(
                                  appointmentDateTime
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1.5">
                                <Clock3
                                  size={14}
                                />

                                {formatTime(
                                  appointmentDateTime
                                )}
                              </span>

                            </div>

                          </div>

                        </div>


                        {/* STATUS */}

                        <div
                          className={`
                            inline-flex
                            w-fit
                            shrink-0
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            px-3
                            py-1.5
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            ${statusStyle.wrapper}
                          `}
                        >

                          <StatusIcon
                            size={13}
                          />

                          {status}

                        </div>

                      </div>


                      {/* =================================
                          DETAILS
                      ================================= */}

                      <div
                        className="
                          mt-5
                          grid
                          gap-3
                          border-t
                          border-slate-100
                          pt-5
                          sm:grid-cols-2
                          dark:border-slate-800
                        "
                      >

                        <DetailItem
                          icon={FileText}
                          label="Reason for visit"
                          value={
                            appointment.reason ||
                            "Not specified"
                          }
                        />

                        {appointment.doctor_email && (
                          <DetailItem
                            icon={Mail}
                            label="Doctor email"
                            value={
                              appointment.doctor_email
                            }
                          />
                        )}

                      </div>


                      {/* =================================
                          COMPLETED
                      ================================= */}

                      {completed && (
                        <div className="mt-5">

                          <div
                            className="
                              rounded-xl
                              border
                              border-slate-200
                              bg-slate-50
                              px-4
                              py-3
                              text-xs
                              text-slate-600
                              dark:border-slate-700
                              dark:bg-slate-800/60
                              dark:text-slate-300
                            "
                          >
                            This appointment has been
                            completed.
                          </div>


                          {hasPostVisit ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPostVisitAppointment(
                                  appointment
                                )
                              }
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-4
                                py-2.5
                                text-xs
                                font-bold
                                text-white
                                shadow-sm
                                transition
                                hover:bg-blue-700
                              "
                            >

                              <Eye size={15} />

                              View post-visit summary

                            </button>
                          ) : (
                            <div
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-slate-200
                                px-4
                                py-2.5
                                text-xs
                                font-semibold
                                text-slate-500
                                dark:border-slate-700
                                dark:text-slate-400
                              "
                            >

                              <Clock3
                                size={14}
                              />

                              Visit summary is not
                              available yet.

                            </div>
                          )}

                        </div>
                      )}


                      {/* =================================
                          SCHEDULED ACTIONS
                      ================================= */}

                      {!completed &&
                        !cancelled && (
                          <div
                            className="
                              mt-5
                              flex
                              flex-col
                              gap-2
                              border-t
                              border-slate-100
                              pt-5
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                              dark:border-slate-800
                            "
                          >

                            {/* PRE VISIT */}

                            {hasPreVisit ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreVisitViewAppointment(
                                    appointment
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  border
                                  border-blue-200
                                  bg-blue-50
                                  px-4
                                  py-2.5
                                  text-xs
                                  font-bold
                                  text-blue-700
                                  transition
                                  hover:bg-blue-100
                                  dark:border-blue-500/20
                                  dark:bg-blue-500/10
                                  dark:text-blue-300
                                "
                              >

                                <Eye
                                  size={15}
                                />

                                View pre-visit summary

                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openPreVisitForm(
                                    appointment
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  bg-blue-600
                                  px-4
                                  py-2.5
                                  text-xs
                                  font-bold
                                  text-white
                                  shadow-sm
                                  transition
                                  hover:bg-blue-700
                                "
                              >

                                <Plus size={15} />

                                Add pre-visit summary

                              </button>
                            )}


                            {/* CANCEL */}

                            <button
                              type="button"
                              disabled={
                                actionLoading
                              }
                              onClick={() =>
                                handleCancel(
                                  appointmentId
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-red-200
                                bg-red-50
                                px-4
                                py-2.5
                                text-xs
                                font-bold
                                text-red-700
                                transition
                                hover:bg-red-100
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                dark:border-red-500/20
                                dark:bg-red-500/10
                                dark:text-red-400
                                dark:hover:bg-red-500/20
                              "
                            >

                              <X size={15} />

                              Cancel appointment

                            </button>

                          </div>
                        )}


                      {/* =================================
                          CANCELLED
                      ================================= */}

                      {cancelled && (
                        <div
                          className="
                            mt-5
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-xs
                            text-red-700
                            dark:border-red-500/20
                            dark:bg-red-500/10
                            dark:text-red-300
                          "
                        >

                          This appointment was
                          cancelled.

                        </div>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>


      {/* =====================================================
          PRE-VISIT FORM MODAL
      ===================================================== */}

      {preVisitAppointment && (
        <ModalOverlay
          onClose={() =>
            !actionLoading &&
            setPreVisitAppointment(null)
          }
        >

          <div className="overflow-hidden">

            {/* HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
                border-b
                border-slate-100
                p-6
                dark:border-slate-800
              "
            >

              <div>

                <div className="mb-2 flex items-center gap-2">

                  <div
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-blue-50
                      text-blue-600
                      dark:bg-blue-500/10
                      dark:text-blue-400
                    "
                  >
                    <FileText size={16} />
                  </div>

                  <span
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-blue-600
                      dark:text-blue-400
                    "
                  >
                    Pre-visit summary
                  </span>

                </div>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Share your symptoms
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Give your doctor some context
                  before the appointment.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  setPreVisitAppointment(
                    null
                  )
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                  dark:hover:bg-slate-800
                  dark:hover:text-slate-200
                "
              >
                <X size={18} />
              </button>

            </div>


            {/* BODY */}

            <div className="p-6">

              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50
                  p-4
                  dark:border-blue-500/20
                  dark:bg-blue-500/10
                "
              >

                <div className="flex items-center gap-3">

                  <UserRound
                    size={17}
                    className="
                      text-blue-600
                      dark:text-blue-400
                    "
                  />

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-blue-500
                      "
                    >
                      Appointment with
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-sm
                        font-bold
                        text-slate-800
                        dark:text-slate-200
                      "
                    >
                      Dr.{" "}
                      {getDoctorName(
                        preVisitAppointment
                      ).replace(
                        /^Dr\.?\s*/i,
                        ""
                      )}
                    </p>

                  </div>

                </div>

              </div>


              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Symptoms or concerns
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>


              <textarea
                rows={7}
                value={preVisitText}
                onChange={(event) =>
                  setPreVisitText(
                    event.target.value
                  )
                }
                placeholder="Describe your symptoms, how long you've had them, and anything you'd like the doctor to know..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                  dark:focus:border-blue-500
                "
              />


              <p
                className="
                  mt-2
                  text-[11px]
                  leading-5
                  text-slate-400
                "
              >
                This summary can only be submitted
                once for this appointment.
              </p>

            </div>


            {/* FOOTER */}

            <div
              className="
                flex
                flex-col-reverse
                gap-2
                border-t
                border-slate-100
                bg-slate-50
                p-5
                sm:flex-row
                sm:justify-end
                dark:border-slate-800
                dark:bg-slate-950
              "
            >

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  setPreVisitAppointment(
                    null
                  )
                }
                className="
                  h-10
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  text-sm
                  font-bold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  disabled:opacity-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-300
                "
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={
                  actionLoading ||
                  !preVisitText.trim()
                }
                onClick={
                  handlePreVisitSubmit
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                <FileText size={15} />

                {actionLoading
                  ? "Submitting..."
                  : "Submit summary"}

              </button>

            </div>

          </div>

        </ModalOverlay>
      )}


      {/* =====================================================
          VIEW PRE-VISIT MODAL
      ===================================================== */}

      {preVisitViewAppointment && (
        <ModalOverlay
          onClose={() =>
            setPreVisitViewAppointment(
              null
            )
          }
        >

          <div className="overflow-hidden">

            <div
              className="
                flex
                items-start
                justify-between
                border-b
                border-slate-100
                p-6
                dark:border-slate-800
              "
            >

              <div>

                <div className="mb-2 flex items-center gap-2">

                  <div
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-blue-50
                      text-blue-600
                      dark:bg-blue-500/10
                      dark:text-blue-400
                    "
                  >
                    <Eye size={16} />
                  </div>

                  <span
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-blue-600
                      dark:text-blue-400
                    "
                  >
                    Pre-visit summary
                  </span>

                </div>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Your submitted information
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setPreVisitViewAppointment(
                    null
                  )
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                "
              >
                <X size={18} />
              </button>

            </div>


            <div className="p-6">

              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50
                  p-4
                  dark:border-blue-500/20
                  dark:bg-blue-500/10
                "
              >

                <div className="flex items-center gap-3">

                  <UserRound
                    size={17}
                    className="
                      text-blue-600
                      dark:text-blue-400
                    "
                  />

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-blue-500
                      "
                    >
                      Appointment with
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-sm
                        font-bold
                        text-slate-800
                        dark:text-slate-200
                      "
                    >
                      Dr.{" "}
                      {getDoctorName(
                        preVisitViewAppointment
                      ).replace(
                        /^Dr\.?\s*/i,
                        ""
                      )}
                    </p>

                  </div>

                </div>

              </div>


              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-5
                  dark:border-slate-700
                  dark:bg-slate-950
                "
              >

                <p
                  className="
                    mb-2
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Symptoms or concerns
                </p>

                <p
                  className="
                    whitespace-pre-wrap
                    text-sm
                    leading-6
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {getSymptomsText(
                    getAppointmentId(
                      preVisitViewAppointment
                    )
                  ) || "No information submitted."}
                </p>

              </div>


              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-emerald-200
                  bg-emerald-50
                  px-4
                  py-3
                  text-xs
                  text-emerald-700
                  dark:border-emerald-500/20
                  dark:bg-emerald-500/10
                  dark:text-emerald-300
                "
              >
                This pre-visit summary has already
                been submitted and cannot be edited.
              </div>

            </div>


            <div
              className="
                flex
                justify-end
                border-t
                border-slate-100
                bg-slate-50
                p-5
                dark:border-slate-800
                dark:bg-slate-950
              "
            >

              <button
                type="button"
                onClick={() =>
                  setPreVisitViewAppointment(
                    null
                  )
                }
                className="
                  h-10
                  rounded-xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-bold
                  text-white
                  hover:bg-blue-700
                "
              >
                Close
              </button>

            </div>

          </div>

        </ModalOverlay>
      )}


      {/* =====================================================
          POST-VISIT SUMMARY MODAL
      ===================================================== */}

      {postVisitAppointment && (
        <ModalOverlay
          onClose={() =>
            setPostVisitAppointment(null)
          }
          wide
        >

          <div className="max-h-[90vh] overflow-y-auto">

            {/* HEADER */}

            <div
              className="
                sticky
                top-0
                z-10
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-slate-100
                bg-white
                p-6
                dark:border-slate-800
                dark:bg-slate-900
              "
            >

              <div className="flex items-start gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                    dark:bg-blue-500/10
                    dark:text-blue-400
                  "
                >
                  <Sparkles size={20} />
                </div>

                <div>

                  <div
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-blue-600
                      dark:text-blue-400
                    "
                  >
                    Post-visit summary
                  </div>

                  <h2
                    className="
                      mt-1
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Your visit summary
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Summary generated from your
                    doctor's visit documentation.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  setPostVisitAppointment(
                    null
                  )
                }
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                "
              >
                <X size={18} />
              </button>

            </div>


            {/* BODY */}

            <div className="space-y-5 p-6">

              {/* APPOINTMENT */}

              <div
                className="
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50
                  p-4
                  dark:border-blue-500/20
                  dark:bg-blue-500/10
                "
              >

                <div className="flex items-center gap-3">

                  <CheckCircle2
                    size={18}
                    className="
                      text-blue-600
                      dark:text-blue-400
                    "
                  />

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-blue-500
                      "
                    >
                      Completed appointment
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-sm
                        font-bold
                        text-slate-800
                        dark:text-slate-200
                      "
                    >
                      Dr.{" "}
                      {getDoctorName(
                        postVisitAppointment
                      ).replace(
                        /^Dr\.?\s*/i,
                        ""
                      )}
                    </p>

                  </div>

                </div>

              </div>


              {/* AI SUMMARY */}

              <VisitSection
                icon={Sparkles}
                title="AI-generated summary"
                value={getVisitValue(
                  visitMap[
                    getAppointmentId(
                      postVisitAppointment
                    )
                  ],
                  [
                    "summary",
                    "ai_summary",
                    "generated_summary",
                    "visit_summary",
                  ]
                )}
                highlight
              />


              {/* CLINICAL NOTES */}

              <VisitSection
                icon={FileText}
                title="Clinical notes"
                value={getVisitValue(
                  visitMap[
                    getAppointmentId(
                      postVisitAppointment
                    )
                  ],
                  [
                    "clinical_notes",
                    "notes",
                  ]
                )}
              />


              {/* PRESCRIPTION */}

              <VisitSection
                icon={FileText}
                title="Prescription / care plan"
                value={getVisitValue(
                  visitMap[
                    getAppointmentId(
                      postVisitAppointment
                    )
                  ],
                  [
                    "prescription",
                    "care_plan",
                    "prescription_care_plan",
                  ]
                )}
              />

            </div>


            {/* FOOTER */}

            <div
              className="
                flex
                justify-end
                border-t
                border-slate-100
                bg-slate-50
                p-5
                dark:border-slate-800
                dark:bg-slate-950
              "
            >

              <button
                type="button"
                onClick={() =>
                  setPostVisitAppointment(
                    null
                  )
                }
                className="
                  h-10
                  rounded-xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-bold
                  text-white
                  hover:bg-blue-700
                "
              >
                Close
              </button>

            </div>

          </div>

        </ModalOverlay>
      )}

    </div>
  );
}


/* =========================================================
   MODAL OVERLAY
========================================================= */

function ModalOverlay({
  children,
  onClose,
  wide = false,
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
      onClick={onClose}
    >

      <div
        className={`
          w-full
          ${
            wide
              ? "max-w-3xl"
              : "max-w-lg"
          }
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          dark:border-slate-800
          dark:bg-slate-900
        `}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>

    </div>
  );
}


/* =========================================================
   VISIT SECTION
========================================================= */

function VisitSection({
  icon: Icon,
  title,
  value,
  highlight = false,
}) {
  return (
    <section
      className={`
        rounded-2xl
        border
        p-5
        ${
          highlight
            ? "border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        }
      `}
    >

      <div className="mb-3 flex items-center gap-2">

        <Icon
          size={16}
          className={
            highlight
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 dark:text-slate-400"
          }
        />

        <h3
          className={`
            text-xs
            font-bold
            ${
              highlight
                ? "text-blue-800 dark:text-blue-200"
                : "text-slate-800 dark:text-slate-200"
            }
          `}
        >
          {title}
        </h3>

      </div>


      <div
        className="
          whitespace-pre-wrap
          text-sm
          leading-7
          text-slate-700
          dark:text-slate-300
        "
      >
        {value || "Not provided."}
      </div>

    </section>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      "
    >

      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-blue-50
          text-blue-600
          dark:bg-blue-500/10
          dark:text-blue-400
        "
      >
        <Icon size={20} />
      </div>

      <div>

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            text-xl
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          {value}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">

      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-slate-100
          text-slate-500
          dark:bg-slate-800
          dark:text-slate-400
        "
      >
        <Icon size={15} />
      </div>

      <div className="min-w-0">

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            break-words
            text-xs
            font-semibold
            text-slate-700
            dark:text-slate-300
          "
        >
          {value}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   EMPTY
========================================================= */

function EmptyAppointments() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-dashed
        border-slate-300
        bg-white
        p-10
        text-center
        dark:border-slate-700
        dark:bg-slate-900
      "
    >

      <div
        className="
          mx-auto
          mb-4
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-blue-50
          text-blue-600
          dark:bg-blue-500/10
          dark:text-blue-400
        "
      >
        <CalendarDays size={20} />
      </div>

      <div
        className="
          text-base
          font-bold
          text-slate-900
          dark:text-white
        "
      >
        No appointments yet
      </div>

      <div
        className="
          mt-1
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
        Your scheduled appointments will
        appear here.
      </div>

    </div>
  );
}


/* =========================================================
   APPOINTMENT SKELETON
========================================================= */

function AppointmentSkeleton() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      "
    >

      <div className="flex items-start gap-4">

        <div
          className="
            h-12
            w-12
            animate-pulse
            rounded-xl
            bg-slate-200
            dark:bg-slate-800
          "
        />

        <div className="flex-1">

          <div
            className="
              h-5
              w-48
              animate-pulse
              rounded
              bg-slate-200
              dark:bg-slate-800
            "
          />

          <div
            className="
              mt-3
              h-4
              w-64
              animate-pulse
              rounded
              bg-slate-200
              dark:bg-slate-800
            "
          />

          <div
            className="
              mt-5
              h-16
              w-full
              animate-pulse
              rounded-xl
              bg-slate-200
              dark:bg-slate-800
            "
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SUMMARY SKELETON
========================================================= */

function SummarySkeleton() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        dark:border-slate-800
        dark:bg-slate-900
      "
    >

      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

      <div className="mt-4 h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

      <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

    </div>
  );
}


export default MyAppointments;

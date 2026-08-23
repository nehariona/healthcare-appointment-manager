import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Mail,
  Stethoscope,
  UserRound,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Ban,
  Eye,
  Send,
  Loader2,
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
    status
      ?.toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .trim() ||
    "scheduled"
  );
}


function isCompleted(appointment) {
  const status = getStatus(appointment?.status);

  return (
    status === "completed" ||
    status === "complete"
  );
}


function isCancelled(appointment) {
  const status = getStatus(appointment?.status);

  return (
    status === "cancelled" ||
    status === "canceled"
  );
}


function isUpcoming(appointment) {
  return (
    !isCompleted(appointment) &&
    !isCancelled(appointment)
  );
}


function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

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
  if (!value) {
    return "Time unavailable";
  }

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


/*
 * Backend responses can differ slightly depending on
 * your Pydantic schema. These helpers make the UI tolerant
 * of common response shapes.
 */

function extractSymptomsText(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    const item = data[0];

    if (!item) {
      return "";
    }

    return (
      item.symptoms ||
      item.symptom_text ||
      item.description ||
      item.content ||
      ""
    );
  }

  return (
    data.symptoms ||
    data.symptom_text ||
    data.description ||
    data.content ||
    ""
  );
}


function extractVisitSummary(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    const item = data[0];

    if (!item) {
      return "";
    }

    return extractVisitSummary(item);
  }

  /*
   * Most likely fields first.
   */

  if (data.ai_summary) {
    return data.ai_summary;
  }

  if (data.summary) {
    return data.summary;
  }

  if (data.visit_summary) {
    return data.visit_summary;
  }

  if (data.generated_summary) {
    return data.generated_summary;
  }

  if (data.ai_generated_summary) {
    return data.ai_generated_summary;
  }

  if (data.post_visit_summary) {
    return data.post_visit_summary;
  }

  if (data.content) {
    return data.content;
  }

  /*
   * Sometimes the backend may return nested data.
   */

  if (data.visit) {
    const nested = extractVisitSummary(data.visit);

    if (nested) {
      return nested;
    }
  }

  if (data.data) {
    const nested = extractVisitSummary(data.data);

    if (nested) {
      return nested;
    }
  }

  return "";
}


function extractClinicalNotes(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  return (
    data.clinical_notes ||
    data.notes ||
    data.doctor_notes ||
    ""
  );
}


function extractPrescription(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  return (
    data.prescription ||
    data.care_plan ||
    data.treatment ||
    ""
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function MyAppointments() {

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);


  /* =======================================================
     PRE-VISIT DATA

     Map:
       appointmentId -> submitted symptoms
  ======================================================= */

  const [symptomsMap, setSymptomsMap] =
    useState({});


  /* =======================================================
     POST-VISIT DATA

     Map:
       appointmentId -> visit response
  ======================================================= */

  const [visitMap, setVisitMap] =
    useState({});


  /* =======================================================
     PRE-VISIT MODAL
  ======================================================= */

  const [preVisitAppointment, setPreVisitAppointment] =
    useState(null);

  const [preVisitText, setPreVisitText] =
    useState("");

  const [preVisitViewOnly, setPreVisitViewOnly] =
    useState(false);


  /* =======================================================
     POST-VISIT MODAL
  ======================================================= */

  const [postVisitAppointment, setPostVisitAppointment] =
    useState(null);

  const [postVisitLoading, setPostVisitLoading] =
    useState(false);


  /* =======================================================
     LOAD APPOINTMENTS
  ======================================================= */

  async function loadAppointments() {

    try {

      setLoading(true);
      setError("");

      const data =
        await getMyAppointments();

      const appointmentList =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.appointments)
            ? data.appointments
            : [];

      setAppointments(appointmentList);

      /*
       * Load pre/post visit information after
       * getting the appointments.
       */

      await loadAppointmentDetails(
        appointmentList
      );

    } catch (err) {

      console.error(
        "Unable to load appointments:",
        err
      );

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
     LOAD SYMPTOMS + VISITS
  ======================================================= */

  async function loadAppointmentDetails(
    appointmentList
  ) {

    if (!appointmentList?.length) {
      setSymptomsMap({});
      setVisitMap({});
      return;
    }

    const nextSymptomsMap = {};
    const nextVisitMap = {};

    /*
     * We only need symptoms for appointments
     * that are relevant to the patient.
     */

    await Promise.all(
      appointmentList.map(
        async (appointment) => {

          const appointmentId =
            getAppointmentId(
              appointment
            );

          if (!appointmentId) {
            return;
          }

          /*
           * ---------------------------------------------
           * PRE-VISIT SYMPTOMS
           * ---------------------------------------------
           */

          try {

            const symptomsResponse =
              await getAppointmentSymptoms(
                appointmentId
              );

            const symptoms =
              extractSymptomsText(
                symptomsResponse
              );

            if (symptoms) {

              nextSymptomsMap[
                appointmentId
              ] = symptoms;

            }

          } catch (err) {

            /*
             * 404 / no symptoms is NOT a fatal error.
             *
             * It simply means the patient has not
             * submitted a pre-visit summary.
             */

            console.log(
              `No pre-visit summary for appointment ${appointmentId}`
            );

          }


          /*
           * ---------------------------------------------
           * POST-VISIT
           * ---------------------------------------------
           *
           * Only completed appointments need a visit.
           */

          if (
            isCompleted(appointment)
          ) {

            try {

              const visitResponse =
                await getVisit(
                  appointmentId
                );

              if (visitResponse) {

                nextVisitMap[
                  appointmentId
                ] = visitResponse;

              }

            } catch (err) {

              /*
               * A completed appointment may not have
               * a visit recorded yet.
               */

              console.log(
                `No post-visit summary for appointment ${appointmentId}`
              );

            }

          }

        }
      )
    );


    setSymptomsMap(
      nextSymptomsMap
    );

    setVisitMap(
      nextVisitMap
    );
  }


  useEffect(() => {

    loadAppointments();

  }, []);


  /* =========================================================
     CANCEL APPOINTMENT
  ========================================================= */

  async function handleCancel(
    appointmentId
  ) {

    const confirmed =
      window.confirm(
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


  /* =========================================================
     OPEN PRE-VISIT FORM
  ========================================================= */

  function openPreVisitForm(
    appointment
  ) {

    const appointmentId =
      getAppointmentId(
        appointment
      );

    if (!appointmentId) {
      setError(
        "Unable to identify this appointment."
      );
      return;
    }

    /*
     * If symptoms already exist,
     * open READ-ONLY mode.
     */

    if (
      symptomsMap[appointmentId]
    ) {

      setPreVisitAppointment(
        appointment
      );

      setPreVisitText(
        symptomsMap[appointmentId]
      );

      setPreVisitViewOnly(
        true
      );

      return;
    }

    /*
     * Otherwise allow submission.
     */

    setPreVisitAppointment(
      appointment
    );

    setPreVisitText("");

    setPreVisitViewOnly(
      false
    );
  }


  /* =========================================================
     CLOSE PRE-VISIT
  ========================================================= */

  function closePreVisit() {

    if (actionLoading) {
      return;
    }

    setPreVisitAppointment(
      null
    );

    setPreVisitText("");

    setPreVisitViewOnly(
      false
    );
  }


  /* =========================================================
     SUBMIT PRE-VISIT SUMMARY
  ========================================================= */

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
        "Unable to identify this appointment."
      );

      return;
    }

    /*
     * Safety check:
     * If already submitted, never submit again.
     */

    if (
      symptomsMap[appointmentId]
    ) {

      setPreVisitText(
        symptomsMap[appointmentId]
      );

      setPreVisitViewOnly(
        true
      );

      return;
    }


    if (!preVisitText.trim()) {

      setError(
        "Please describe your symptoms before submitting the pre-visit summary."
      );

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
       * Immediately store the submitted text
       * locally so the UI changes to
       * "View pre-visit summary".
       */

      const submittedSymptoms =
        extractSymptomsText(
          response
        ) ||
        preVisitText.trim();


      setSymptomsMap(
        (current) => ({
          ...current,

          [appointmentId]:
            submittedSymptoms,

        })
      );


      setPreVisitText(
        submittedSymptoms
      );

      setPreVisitViewOnly(
        true
      );


    } catch (err) {

      console.error(
        "Pre-visit submission failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to submit pre-visit summary."
      );

    } finally {

      setActionLoading(false);

    }
  }


  /* =========================================================
     OPEN POST-VISIT SUMMARY
  ========================================================= */

  async function openPostVisitSummary(
    appointment
  ) {

    const appointmentId =
      getAppointmentId(
        appointment
      );

    if (!appointmentId) {

      setError(
        "Unable to identify this appointment."
      );

      return;
    }


    setPostVisitAppointment(
      appointment
    );

    setPostVisitLoading(
      true
    );

    setError("");


    /*
     * Use cached visit first.
     */

    if (
      visitMap[appointmentId]
    ) {

      setPostVisitLoading(
        false
      );

      return;
    }


    try {

      const response =
        await getVisit(
          appointmentId
        );


      setVisitMap(
        (current) => ({
          ...current,

          [appointmentId]:
            response,

        })
      );

    } catch (err) {

      console.error(
        "Unable to load post-visit summary:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load post-visit summary."
      );

    } finally {

      setPostVisitLoading(
        false
      );

    }
  }


  /* =========================================================
     CLOSE POST-VISIT
  ========================================================= */

  function closePostVisit() {

    if (postVisitLoading) {
      return;
    }

    setPostVisitAppointment(
      null
    );
  }


  /* =========================================================
     COUNTS
  ========================================================= */

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        isUpcoming(appointment)
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


  /* =========================================================
     STATUS STYLE
  ========================================================= */

  function getStatusStyle(
    status
  ) {

    const value =
      getStatus(status);


    if (
      value === "completed" ||
      value === "complete"
    ) {

      return {
        wrapper:
          "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",

        icon:
          CheckCircle2,
      };

    }


    if (
      value === "cancelled" ||
      value === "canceled"
    ) {

      return {
        wrapper:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",

        icon:
          Ban,
      };

    }


    return {

      wrapper:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",

      icon:
        CheckCircle2,

    };

  }


  /* =========================================================
     LOADING
  ========================================================= */

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

        <div className="mx-auto max-w-6xl space-y-5">

          <AppointmentSkeleton />

          <AppointmentSkeleton />

          <AppointmentSkeleton />

        </div>

      </div>

    );
  }


  /* =========================================================
     MAIN UI
  ========================================================= */

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


        {/* =====================================================
            HEADER
        ===================================================== */}

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

            <div
              className="
                mb-2
                flex items-center gap-2
              "
            >

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

                <CalendarDays
                  size={18}
                />

              </div>

              <span
                className="
                  text-xs font-bold
                  uppercase
                  tracking-[0.16em]
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
                max-w-2xl
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Manage your appointments,
              share pre-visit information,
              and view your post-visit summaries.
            </p>

          </div>


          <button
            type="button"
            onClick={loadAppointments}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
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

            <RefreshIcon />

            Refresh

          </button>

        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div
            className="
              mb-6
              flex items-start
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
            >
              <X size={16} />
            </button>

          </div>

        )}


        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

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
            value={
              upcomingAppointments
            }
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={
              completedAppointments
            }
          />

          <SummaryCard
            icon={Ban}
            label="Cancelled"
            value={
              cancelledAppointments
            }
          />

        </div>


        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {appointments.length === 0 ? (

          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-white
              p-10
              text-center
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >

            <div
              className="
                mx-auto mb-4
                flex h-14 w-14
                items-center justify-center
                rounded-2xl
                bg-blue-50
                text-blue-600
                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >

              <CalendarDays
                size={24}
              />

            </div>

            <h2
              className="
                text-lg
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              No appointments yet
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Your appointments will appear
              here once you book one.
            </p>

          </div>

        ) : (

          /* ===================================================
             APPOINTMENT LIST
          =================================================== */

          <div className="space-y-5">

            {appointments.map(
              (appointment, index) => {

                const appointmentId =
                  getAppointmentId(
                    appointment
                  );

                const doctorName =
                  getDoctorName(
                    appointment
                  );

                const dateTime =
                  getAppointmentDateTime(
                    appointment
                  );

                const completed =
                  isCompleted(
                    appointment
                  );

                const cancelled =
                  isCancelled(
                    appointment
                  );

                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const StatusIcon =
                  statusStyle.icon;

                const hasPreVisit =
                  Boolean(
                    appointmentId &&
                    symptomsMap[
                      appointmentId
                    ]
                  );

                const hasPostVisit =
                  Boolean(
                    appointmentId &&
                    visitMap[
                      appointmentId
                    ]
                  );


                /*
                 * IMPORTANT:
                 *
                 * appointmentId is preferred.
                 * index is only a fallback so React
                 * never receives duplicate keys.
                 */

                const cardKey =
                  appointmentId ??
                  `appointment-${index}`;


                return (

                  <article
                    key={cardKey}
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

                    {/* =========================================
                        APPOINTMENT HEADER
                    ========================================= */}

                    <div
                      className="
                        p-5
                        sm:p-6
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                          gap-5
                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                        "
                      >

                        <div
                          className="
                            flex
                            items-start
                            gap-4
                          "
                        >

                          <div
                            className="
                              flex
                              h-12 w-12
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
                              size={21}
                            />

                          </div>


                          <div>

                            <h2
                              className="
                                text-base
                                font-bold
                                text-slate-900
                                dark:text-white
                              "
                            >
                              Dr.{" "}
                              {doctorName.replace(
                                /^Dr\.?\s*/i,
                                ""
                              )}
                            </h2>


                            <div
                              className="
                                mt-2
                                flex
                                flex-wrap
                                gap-x-4
                                gap-y-2
                                text-xs
                                text-slate-500
                                dark:text-slate-400
                              "
                            >

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                "
                              >

                                <CalendarDays
                                  size={14}
                                />

                                {formatDate(
                                  dateTime
                                )}

                              </span>


                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                "
                              >

                                <Clock3
                                  size={14}
                                />

                                {formatTime(
                                  dateTime
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

                          {getStatus(
                            appointment.status
                          )}

                        </div>

                      </div>


                      {/* =========================================
                          DETAILS
                      ========================================= */}

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


                      {/* =========================================
                          ACTIONS
                      ========================================= */}

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
                              sm:flex-wrap
                              dark:border-slate-800
                            "
                          >

                            {/* PRE-VISIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openPreVisitForm(
                                  appointment
                                )
                              }
                              className={`
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                px-4
                                py-2.5
                                text-xs
                                font-bold
                                transition
                                ${
                                  hasPreVisit
                                    ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                    : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                }
                              `}
                            >

                              {hasPreVisit ? (
                                <Eye
                                  size={15}
                                />
                              ) : (
                                <FileText
                                  size={15}
                                />
                              )}

                              {hasPreVisit
                                ? "View pre-visit summary"
                                : "Add pre-visit summary"}

                            </button>


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

                              <Ban
                                size={15}
                              />

                              Cancel appointment

                            </button>

                          </div>

                        )}


                      {/* =========================================
                          COMPLETED ACTIONS
                      ========================================= */}

                      {completed && (

                        <div
                          className="
                            mt-5
                            flex
                            flex-col
                            gap-3
                            border-t
                            border-slate-100
                            pt-5
                            dark:border-slate-800
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                              text-xs
                              font-semibold
                              text-slate-500
                              dark:text-slate-400
                            "
                          >

                            <CheckCircle2
                              size={15}
                              className="
                                text-emerald-500
                              "
                            />

                            This appointment
                            has been completed.

                          </div>


                          {hasPostVisit ? (

                            <button
                              type="button"
                              onClick={() =>
                                openPostVisitSummary(
                                  appointment
                                )
                              }
                              className="
                                inline-flex
                                w-fit
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
                                dark:hover:bg-blue-500/20
                              "
                            >

                              <Eye
                                size={15}
                              />

                              View post-visit summary

                            </button>

                          ) : (

                            <button
                              type="button"
                              onClick={() =>
                                openPostVisitSummary(
                                  appointment
                                )
                              }
                              className="
                                inline-flex
                                w-fit
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                px-4
                                py-2.5
                                text-xs
                                font-bold
                                text-slate-600
                                transition
                                hover:bg-slate-100
                                dark:border-slate-700
                                dark:bg-slate-800
                                dark:text-slate-300
                                dark:hover:bg-slate-700
                              "
                            >

                              <Eye
                                size={15}
                              />

                              View post-visit summary

                            </button>

                          )}

                        </div>

                      )}


                      {/* =========================================
                          CANCELLED INFO
                      ========================================= */}

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
                            font-medium
                            text-red-700
                            dark:border-red-500/20
                            dark:bg-red-500/10
                            dark:text-red-300
                          "
                        >

                          This appointment
                          was cancelled.

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
          PRE-VISIT MODAL
      ===================================================== */}

      {preVisitAppointment && (

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
          onClick={closePreVisit}
        >

          <div
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
              dark:border-slate-800
              dark:bg-slate-900
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

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

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      flex
                      h-8 w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-blue-50
                      text-blue-600
                      dark:bg-blue-500/10
                      dark:text-blue-400
                    "
                  >

                    <FileText
                      size={16}
                    />

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
                  {preVisitViewOnly
                    ? "Your symptoms"
                    : "Share your symptoms"}
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

                  {preVisitViewOnly
                    ? "This summary has already been submitted and can only be viewed."
                    : "Give your doctor some context before the appointment."}

                </p>

              </div>


              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  closePreVisit
                }
                className="
                  flex
                  h-8 w-8
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

                <X
                  size={18}
                />

              </button>

            </div>


            {/* BODY */}

            <div className="p-6">

              {/* DOCTOR */}

              <div
                className="
                  mb-4
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50
                  p-4
                  dark:border-blue-500/20
                  dark:bg-blue-500/10
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

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
              </label>


              <textarea
                rows={7}
                value={
                  preVisitText
                }
                onChange={
                  preVisitViewOnly
                    ? undefined
                    : (event) =>
                        setPreVisitText(
                          event.target.value
                        )
                }
                readOnly={
                  preVisitViewOnly
                }
                placeholder="
                  Describe your symptoms,
                  how long you've had them,
                  and anything you'd like
                  the doctor to know...
                "
                className={`
                  w-full
                  resize-none
                  rounded-xl
                  border
                  p-4
                  text-sm
                  leading-6
                  outline-none
                  transition
                  ${
                    preVisitViewOnly
                      ? "cursor-default border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  }
                `}
              />


              {preVisitViewOnly && (

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-emerald-200
                    bg-emerald-50
                    px-3
                    py-2.5
                    text-xs
                    font-semibold
                    text-emerald-700
                    dark:border-emerald-500/20
                    dark:bg-emerald-500/10
                    dark:text-emerald-300
                  "
                >

                  <CheckCircle2
                    size={15}
                  />

                  Pre-visit summary
                  submitted successfully.

                </div>

              )}

            </div>


            {/* ACTIONS */}

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
                onClick={
                  closePreVisit
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
                Close
              </button>


              {!preVisitViewOnly && (

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

                  {actionLoading ? (

                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                  ) : (

                    <Send
                      size={16}
                    />

                  )}

                  {actionLoading
                    ? "Submitting..."
                    : "Submit summary"}

                </button>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          POST-VISIT SUMMARY MODAL
      ===================================================== */}

      {postVisitAppointment && (

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
          onClick={closePostVisit}
        >

          <div
            className="
              max-h-[90vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
              dark:border-slate-800
              dark:bg-slate-900
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div
              className="
                sticky
                top-0
                z-10
                flex
                items-start
                justify-between
                border-b
                border-slate-100
                bg-white
                p-6
                dark:border-slate-800
                dark:bg-slate-900
              "
            >

              <div>

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      flex
                      h-8 w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-emerald-50
                      text-emerald-600
                      dark:bg-emerald-500/10
                      dark:text-emerald-400
                    "
                  >

                    <CheckCircle2
                      size={16}
                    />

                  </div>


                  <span
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-emerald-600
                      dark:text-emerald-400
                    "
                  >
                    Post-visit summary
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


              <button
                type="button"
                disabled={
                  postVisitLoading
                }
                onClick={
                  closePostVisit
                }
                className="
                  flex
                  h-8 w-8
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

                <X
                  size={18}
                />

              </button>

            </div>


            {/* BODY */}

            <div className="space-y-5 p-6">

              {/* DOCTOR */}

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

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <Stethoscope
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


              {postVisitLoading ? (

                <div
                  className="
                    flex
                    min-h-48
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    dark:border-slate-800
                    dark:bg-slate-950
                  "
                >

                  <Loader2
                    size={28}
                    className="
                      animate-spin
                      text-blue-600
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-sm
                      font-semibold
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    Loading your visit summary...
                  </p>

                </div>

              ) : (

                <PostVisitContent
                  visit={
                    visitMap[
                      getAppointmentId(
                        postVisitAppointment
                      )
                    ]
                  }
                />

              )}

            </div>


            {/* FOOTER */}

            <div
              className="
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
                onClick={
                  closePostVisit
                }
                disabled={
                  postVisitLoading
                }
                className="
                  ml-auto
                  flex
                  h-10
                  items-center
                  justify-center
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
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   POST VISIT CONTENT
========================================================= */

function PostVisitContent({
  visit,
}) {

  if (!visit) {

    return (

      <div
        className="
          rounded-2xl
          border
          border-dashed
          border-slate-200
          bg-slate-50
          p-8
          text-center
          dark:border-slate-800
          dark:bg-slate-950
        "
      >

        <FileText
          size={28}
          className="
            mx-auto
            text-slate-400
          "
        />

        <h3
          className="
            mt-3
            text-sm
            font-bold
            text-slate-700
            dark:text-slate-300
          "
        >
          Post-visit summary not available yet
        </h3>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          Your doctor has not recorded the
          visit summary yet.
        </p>

      </div>

    );
  }


  const summary =
    extractVisitSummary(
      visit
    );

  const clinicalNotes =
    extractClinicalNotes(
      visit
    );

  const prescription =
    extractPrescription(
      visit
    );


  return (

    <div className="space-y-4">

      {/* AI SUMMARY */}

      {summary && (

        <section
          className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
            dark:border-blue-500/20
            dark:bg-blue-500/10
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <div
              className="
                flex
                h-8 w-8
                items-center
                justify-center
                rounded-lg
                bg-blue-100
                text-blue-600
                dark:bg-blue-500/20
                dark:text-blue-300
              "
            >

              <FileText
                size={16}
              />

            </div>


            <div>

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-blue-600
                  dark:text-blue-300
                "
              >
                AI-generated summary
              </p>

              <p
                className="
                  text-xs
                  text-blue-700
                  dark:text-blue-300
                "
              >
                Your doctor's visit documentation
                has been summarized.
              </p>

            </div>

          </div>


          <div
            className="
              mt-4
              whitespace-pre-wrap
              text-sm
              leading-6
              text-slate-700
              dark:text-slate-200
            "
          >
            {summary}
          </div>

        </section>

      )}


      {/* CLINICAL NOTES */}

      {clinicalNotes && (

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-5
            dark:border-slate-800
            dark:bg-slate-950
          "
        >

          <div
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-slate-400
            "
          >
            Clinical notes
          </div>


          <div
            className="
              mt-3
              whitespace-pre-wrap
              text-sm
              leading-6
              text-slate-700
              dark:text-slate-300
            "
          >
            {clinicalNotes}
          </div>

        </section>

      )}


      {/* PRESCRIPTION */}

      {prescription && (

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-5
            dark:border-slate-800
            dark:bg-slate-950
          "
        >

          <div
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-slate-400
            "
          >
            Prescription / care plan
          </div>


          <div
            className="
              mt-3
              whitespace-pre-wrap
              text-sm
              leading-6
              text-slate-700
              dark:text-slate-300
            "
          >
            {prescription}
          </div>

        </section>

      )}


      {!summary &&
        !clinicalNotes &&
        !prescription && (

          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-slate-50
              p-8
              text-center
              dark:border-slate-800
              dark:bg-slate-950
            "
          >

            <FileText
              size={28}
              className="
                mx-auto
                text-slate-400
              "
            />

            <h3
              className="
                mt-3
                text-sm
                font-bold
                text-slate-700
                dark:text-slate-300
              "
            >
              Summary not available yet
            </h3>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              The doctor has completed the
              appointment, but the visit
              documentation is not available yet.
            </p>

          </div>

        )}

    </div>

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
          h-11 w-11
          items-center
          justify-center
          rounded-xl
          bg-blue-50
          text-blue-600
          dark:bg-blue-500/10
          dark:text-blue-400
        "
      >

        <Icon
          size={20}
        />

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

    <div
      className="
        flex
        items-start
        gap-3
      "
    >

      <div
        className="
          flex
          h-8 w-8
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

        <Icon
          size={15}
        />

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
            truncate
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
   REFRESH ICON
========================================================= */

function RefreshIcon() {

  return (

    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4"
      />

      <path
        d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"
      />

    </svg>

  );
}


/* =========================================================
   SKELETON
========================================================= */

function AppointmentSkeleton() {

  return (

    <div
      className="
        overflow-hidden
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

      <div
        className="
          flex
          items-start
          gap-4
        "
      >

        <div
          className="
            h-12 w-12
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
              h-4
              w-full
              animate-pulse
              rounded
              bg-slate-200
              dark:bg-slate-800
            "
          />

        </div>

      </div>

    </div>

  );
}


export default MyAppointments;
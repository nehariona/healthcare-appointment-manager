import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import LogoutButton from "../components/LogoutButton";

import {
  createVisit,
  getMyAppointments,
  getMyDoctorProfile,
  getVisit,
  getMyProfile,
} from "../api/api";


/* =========================================================
   TONE CLASSES
========================================================= */

const toneClasses = {
  blue: {
    iconWrap: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-300",
  },

  amber: {
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-300",
  },

  emerald: {
    iconWrap: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
  },

  rose: {
    iconWrap: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-300",
    text: "text-rose-700 dark:text-rose-300",
  },
};


/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(value) {
  const status = String(value || "scheduled")
    .trim()
    .toLowerCase();

  if (["confirmed", "scheduled"].includes(status)) {
    return "Scheduled";
  }

  if (["pending", "awaiting intake"].includes(status)) {
    return "Pending";
  }

  if (["completed", "finished", "done"].includes(status)) {
    return "Completed";
  }

  if (["cancelled", "canceled"].includes(status)) {
    return "Cancelled";
  }

  if (["rescheduled"].includes(status)) {
    return "Rescheduled";
  }

  return status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Scheduled";
}


function getRawStatus(appointment) {
  return String(appointment?.status || "")
    .trim()
    .toLowerCase();
}


function isCompletedAppointment(appointment) {
  return [
    "completed",
    "finished",
    "done",
  ].includes(getRawStatus(appointment));
}


function isCancelledAppointment(appointment) {
  return [
    "cancelled",
    "canceled",
  ].includes(getRawStatus(appointment));
}


function isPendingAppointment(appointment) {
  return getRawStatus(appointment) === "pending";
}


function getAppointmentId(appointment) {
  return (
    appointment?.appointment_id ??
    appointment?.id ??
    null
  );
}


function getAppointmentTime(appointment) {
  return (
    appointment?.appointment_time ||
    appointment?.appointment_time_ist ||
    appointment?.date_time ||
    appointment?.datetime ||
    null
  );
}


function formatDateLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatTimeLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}


function formatFullDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


function unwrapResponse(response) {
  if (!response) return null;

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  return response;
}


function extractList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.appointments)) {
    return response.appointments;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}


/* =========================================================
   PROFILE HELPERS
========================================================= */

function getDoctorName(profile, userProfile) {
  return (
    profile?.full_name ||
    profile?.doctor_name ||
    profile?.name ||
    profile?.user?.full_name ||
    profile?.user?.name ||
    profile?.doctor?.full_name ||
    profile?.doctor?.name ||
    profile?.profile?.full_name ||
    profile?.profile?.name ||
    userProfile?.full_name ||
    userProfile?.name ||
    "Doctor"
  );
}


function getSpecialization(profile) {
  return (
    profile?.specialization ||
    profile?.speciality ||
    profile?.specialty ||
    profile?.department ||
    profile?.doctor_specialization ||
    profile?.profile?.specialization ||
    profile?.doctor?.specialization ||
    "—"
  );
}


function getHospital(profile) {
  return (
    profile?.hospital ||
    profile?.hospital_name ||
    profile?.hospitalName ||
    profile?.clinic ||
    profile?.clinic_name ||
    profile?.workplace ||
    profile?.profile?.hospital ||
    profile?.doctor?.hospital ||
    "—"
  );
}


function getExperience(profile) {
  return (
    profile?.experience_years ??
    profile?.experience ??
    profile?.years_of_experience ??
    profile?.years_experience ??
    profile?.profile?.experience_years ??
    profile?.doctor?.experience_years ??
    null
  );
}


/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusClasses(appointment) {
  if (isCompletedAppointment(appointment)) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (isCancelledAppointment(appointment)) {
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  }

  if (isPendingAppointment(appointment)) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }

  return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
}


/* =========================================================
   DOCTOR DASHBOARD
========================================================= */

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);

  const [profile, setProfile] = useState(null);

  const [userProfile, setUserProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [visitLoading, setVisitLoading] = useState(false);

  const [visitExists, setVisitExists] = useState({});

  const [visitForm, setVisitForm] = useState({
    appointmentId: null,
    clinical_notes: "",
    prescription: "",
  });


  /* =======================================================
     CHECK EXISTING VISITS
  ======================================================= */

  const checkExistingVisits = useCallback(
    async (appointmentList) => {
      const completedAppointments =
        appointmentList.filter(
          (appointment) =>
            isCompletedAppointment(appointment)
        );

      if (completedAppointments.length === 0) {
        setVisitExists({});
        return;
      }

      const results = await Promise.all(
        completedAppointments.map(
          async (appointment) => {
            const appointmentId =
              getAppointmentId(appointment);

            if (!appointmentId) {
              return null;
            }

            try {
              const visit =
                await getVisit(appointmentId);

              return {
                appointmentId,
                exists: Boolean(visit),
              };
            } catch (err) {
              if (
                err?.response?.status === 404
              ) {
                return {
                  appointmentId,
                  exists: false,
                };
              }

              console.error(
                `Visit lookup failed for appointment ${appointmentId}:`,
                err
              );

              return {
                appointmentId,
                exists: false,
              };
            }
          }
        )
      );

      const visitMap = {};

      results.forEach((result) => {
        if (!result) return;

        visitMap[result.appointmentId] =
          result.exists;
      });

      setVisitExists(visitMap);
    },
    []
  );


  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        let appointmentsResponse = null;
        let doctorResponse = null;
        let userResponse = null;


        /* -------------------------------------------------
           APPOINTMENTS
        ------------------------------------------------- */

        try {
          appointmentsResponse =
            await getMyAppointments();

          console.log(
            "DOCTOR APPOINTMENTS:",
            appointmentsResponse
          );
        } catch (err) {
          console.error(
            "APPOINTMENTS ERROR:",
            err
          );

          throw err;
        }


        /* -------------------------------------------------
           USER PROFILE
        ------------------------------------------------- */

        try {
          userResponse =
            await getMyProfile();
        } catch (err) {
          console.warn(
            "USER PROFILE ERROR:",
            err
          );
        }


        /* -------------------------------------------------
           DOCTOR PROFILE
        ------------------------------------------------- */

        try {
          doctorResponse =
            await getMyDoctorProfile();
        } catch (err) {
          console.warn(
            "DOCTOR PROFILE ERROR:",
            err
          );

          /*
           * The backend can still return the
           * doctor name through /users/me.
           */
          doctorResponse = null;
        }


        /* -------------------------------------------------
           NORMALIZE APPOINTMENTS
        ------------------------------------------------- */

        const appointmentList =
          extractList(
            appointmentsResponse
          );

        setAppointments(
          appointmentList
        );


        /* -------------------------------------------------
           NORMALIZE USER
        ------------------------------------------------- */

        const normalizedUser =
          unwrapResponse(
            userResponse
          );

        setUserProfile(
          normalizedUser || null
        );


        /* -------------------------------------------------
           NORMALIZE DOCTOR
        ------------------------------------------------- */

        const normalizedDoctor =
          unwrapResponse(
            doctorResponse
          );

        setProfile(
          normalizedDoctor || null
        );


        /* -------------------------------------------------
           VISITS
        ------------------------------------------------- */

        await checkExistingVisits(
          appointmentList
        );

      } catch (err) {
        console.error(
          "DOCTOR DASHBOARD ERROR:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load your doctor dashboard."
        );

        setAppointments([]);
        setVisitExists({});
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [checkExistingVisits]
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  /* =======================================================
     PROFILE
  ======================================================= */

  const doctorName = useMemo(
    () =>
      getDoctorName(
        profile,
        userProfile
      ),
    [profile, userProfile]
  );

  const specialization = useMemo(
    () =>
      getSpecialization(profile),
    [profile]
  );

  const hospital = useMemo(
    () => getHospital(profile),
    [profile]
  );

  const experience = useMemo(
    () => getExperience(profile),
    [profile]
  );


  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const total =
      appointments.length;

    const completed =
      appointments.filter(
        isCompletedAppointment
      ).length;

    const cancelled =
      appointments.filter(
        isCancelledAppointment
      ).length;

    const pending =
      appointments.filter(
        isPendingAppointment
      ).length;

    const scheduled =
      appointments.filter(
        (appointment) =>
          !isCompletedAppointment(
            appointment
          ) &&
          !isCancelledAppointment(
            appointment
          )
      ).length;

    const uniquePatients =
      new Set(
        appointments
          .map(
            (item) =>
              item?.patient_id ||
              item?.patient?.id ||
              item?.patientId
          )
          .filter(Boolean)
      ).size;

    const completionRate =
      total > 0
        ? Math.round(
            (completed / total) * 100
          )
        : 0;

    return {
      total,
      completed,
      cancelled,
      scheduled,
      pending,
      uniquePatients,
      completionRate,
    };
  }, [appointments]);


  /* =======================================================
     TODAY'S APPOINTMENTS
  ======================================================= */

  const todaysAppointments =
    useMemo(() => {
      const today =
        new Date();

      return appointments.filter(
        (appointment) => {
          const value =
            getAppointmentTime(
              appointment
            );

          if (!value) return false;

          const date =
            new Date(value);

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return false;
          }

          return (
            date.getDate() ===
              today.getDate() &&
            date.getMonth() ===
              today.getMonth() &&
            date.getFullYear() ===
              today.getFullYear()
          );
        }
      );
    }, [appointments]);


  /* =======================================================
     OPEN VISIT FORM
  ======================================================= */

  function openVisitForm(
    appointment
  ) {
    const appointmentId =
      getAppointmentId(
        appointment
      );

    if (!appointmentId) {
      setError(
        "Appointment ID is missing."
      );

      return;
    }

    if (
      visitExists[
        appointmentId
      ]
    ) {
      setError(
        "A visit has already been recorded for this appointment."
      );

      return;
    }

    if (
      !isCompletedAppointment(
        appointment
      )
    ) {
      setError(
        "Visit summaries can only be created for completed appointments."
      );

      return;
    }

    setError("");

    setVisitForm({
      appointmentId,
      clinical_notes: "",
      prescription: "",
    });
  }


  /* =======================================================
     CLOSE VISIT FORM
  ======================================================= */

  function closeVisitForm() {
    if (visitLoading) return;

    setVisitForm({
      appointmentId: null,
      clinical_notes: "",
      prescription: "",
    });
  }


  /* =======================================================
     CREATE VISIT
  ======================================================= */

  async function submitVisitSummary() {
    const appointmentId =
      visitForm.appointmentId;

    if (!appointmentId) {
      setError(
        "Select a completed appointment first."
      );

      return;
    }

    if (
      visitExists[appointmentId]
    ) {
      setError(
        "A visit has already been recorded for this appointment."
      );

      closeVisitForm();

      return;
    }

    const clinicalNotes =
      visitForm.clinical_notes.trim();

    if (!clinicalNotes) {
      setError(
        "Clinical notes are required before generating the AI summary."
      );

      return;
    }

    try {
      setVisitLoading(true);
      setError("");

      const payload = {
        appointment_id:
          appointmentId,

        clinical_notes:
          clinicalNotes,

        prescription:
          visitForm.prescription.trim() ||
          "No prescription required.",
      };

      console.log(
        "CREATING VISIT:",
        payload
      );

      await createVisit(
        payload
      );

      setVisitExists(
        (current) => ({
          ...current,
          [appointmentId]:
            true,
        })
      );

      /*
       * Refresh appointments after
       * creating the visit.
       */
      const refreshed =
        await getMyAppointments();

      const refreshedList =
        extractList(refreshed);

      setAppointments(
        refreshedList
      );

      setVisitForm({
        appointmentId: null,
        clinical_notes: "",
        prescription: "",
      });

    } catch (err) {
      console.error(
        "CREATE VISIT ERROR:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (
        status === 400 ||
        status === 409
      ) {
        if (
          typeof detail ===
            "string" &&
          detail
            .toLowerCase()
            .includes("visit")
        ) {
          setVisitExists(
            (current) => ({
              ...current,
              [appointmentId]:
                true,
            })
          );

          closeVisitForm();

          setError(
            "A visit has already been recorded for this appointment."
          );

          return;
        }
      }

      setError(
        detail ||
        err?.message ||
        "Unable to generate the AI visit summary."
      );
    } finally {
      setVisitLoading(false);
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <div className="mx-auto max-w-[1500px] p-3 sm:p-4 xl:p-5">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="panel mb-4 p-4 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Clinical workspace
                </div>

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Active
                </span>

              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Doctor Dashboard
              </h1>

              <p className="mt-1 text-sm text-[var(--muted)]">

                {specialization !== "—"
                  ? specialization
                  : "Specialist"}

                {hospital !== "—" && (
                  <>
                    {" • "}
                    {hospital}
                  </>
                )}

              </p>

            </div>


            {/* ACCOUNT */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  loadDashboard(true)
                }
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 text-sm font-medium transition hover:bg-[var(--bg)] disabled:opacity-50"
                title="Refresh dashboard"
              >

                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>

              </button>


              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">

                  {doctorName
                    .charAt(0)
                    .toUpperCase()}

                </div>

                <div>

                  <div className="max-w-[130px] truncate text-sm font-semibold">
                    {doctorName}
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Doctor
                  </div>

                </div>

              </div>

              <LogoutButton
                compact={true}
                className="rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-sm font-medium text-[var(--text)]"
              />

            </div>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">

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
              className="rounded-lg p-1 hover:bg-rose-500/10"
            >
              <X size={15} />
            </button>

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <DashboardSkeleton />

        ) : (

          <>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                label="Total appointments"
                value={stats.total}
                delta={`${stats.scheduled} active`}
                tone="blue"
                icon={CalendarDays}
              />

              <StatCard
                label="Patients"
                value={stats.uniquePatients}
                delta="unique patients"
                tone="amber"
                icon={Users}
              />

              <StatCard
                label="Completed"
                value={stats.completed}
                delta={`${stats.completionRate}% rate`}
                tone="emerald"
                icon={CheckCircle2}
              />

              <StatCard
                label="Pending"
                value={stats.pending}
                delta={
                  stats.pending > 0
                    ? "needs review"
                    : "all clear"
                }
                tone="rose"
                icon={Bell}
              />

            </section>


            {/* =================================================
                TODAY BANNER
            ================================================= */}

            <div className="panel mb-4 overflow-hidden">

              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">

                    <CalendarDays
                      size={19}
                    />

                  </div>

                  <div>

                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Today
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {todaysAppointments.length ===
                      0
                        ? "No appointments scheduled today"
                        : `${todaysAppointments.length} appointment${
                            todaysAppointments.length ===
                            1
                              ? ""
                              : "s"
                          } today`}
                    </div>

                  </div>

                </div>

                <div className="text-xs text-[var(--muted)]">
                  {formatDateLabel(
                    new Date()
                  )}
                </div>

              </div>

            </div>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">


              {/* =================================================
                  APPOINTMENTS
              ================================================= */}

              <div className="panel p-4 sm:p-5">

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Schedule
                    </div>

                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                      Patient appointments
                    </h2>

                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">

                    <CalendarDays
                      size={12}
                    />

                    {appointments.length} total

                  </div>

                </div>


                {appointments.length ===
                0 ? (

                  <EmptyAppointments />

                ) : (

                  <div className="space-y-3">

                    {appointments.map(
                      (appointment) => {

                        const appointmentId =
                          getAppointmentId(
                            appointment
                          );

                        const completed =
                          isCompletedAppointment(
                            appointment
                          );

                        const cancelled =
                          isCancelledAppointment(
                            appointment
                          );

                        const hasVisit =
                          Boolean(
                            visitExists[
                              appointmentId
                            ]
                          );

                        const patientName =
                          appointment.patient_name ||
                          appointment.patient?.full_name ||
                          appointment.patient?.name ||
                          "Patient";

                        const patientEmail =
                          appointment.patient_email ||
                          appointment.patient?.email ||
                          "No email provided";

                        const appointmentTime =
                          getAppointmentTime(
                            appointment
                          );

                        return (

                          <div
                            key={
                              appointmentId ??
                              `${patientName}-${appointmentTime}`
                            }
                            className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-3 transition hover:border-[var(--primary)]/30 sm:p-4"
                          >

                            {/* TOP */}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <div className="flex min-w-0 items-center gap-3">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">

                                  {patientName
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>

                                <div className="min-w-0">

                                  <div className="truncate text-base font-semibold">
                                    {patientName}
                                  </div>

                                  <div className="truncate text-sm text-[var(--muted)]">
                                    {patientEmail}
                                  </div>

                                </div>

                              </div>


                              <span
                                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(
                                  appointment
                                )}`}
                              >
                                {normalizeStatus(
                                  appointment.status
                                )}
                              </span>

                            </div>


                            {/* DETAILS */}

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">

                              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">

                                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">

                                  <CalendarDays
                                    size={13}
                                    className="text-[var(--primary)]"
                                  />

                                  Date

                                </div>

                                <div className="font-medium">
                                  {formatDateLabel(
                                    appointmentTime
                                  )}
                                </div>

                              </div>


                              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">

                                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">

                                  <Clock3
                                    size={13}
                                    className="text-[var(--primary)]"
                                  />

                                  Time

                                </div>

                                <div className="font-medium">
                                  {formatTimeLabel(
                                    appointmentTime
                                  )}
                                </div>

                              </div>


                              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">

                                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">

                                  <FileText
                                    size={13}
                                    className="text-[var(--primary)]"
                                  />

                                  Reason

                                </div>

                                <div className="truncate font-medium">

                                  {appointment.reason ||
                                    appointment.purpose ||
                                    "Not provided"}

                                </div>

                              </div>

                            </div>


                            {/* EXTRA */}

                            <div className="mt-3 flex flex-col gap-2 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">

                              <span>
                                Appointment #
                                {appointmentId ??
                                  "—"}
                              </span>

                              {appointmentTime && (
                                <span>
                                  {formatFullDateTime(
                                    appointmentTime
                                  )}
                                </span>
                              )}

                            </div>


                            {/* VISIT ACTION */}

                            {completed && (

                              <div className="mt-4 flex justify-end">

                                {hasVisit ? (

                                  <button
                                    type="button"
                                    disabled
                                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  >

                                    <CheckCircle2
                                      size={15}
                                    />

                                    Visit Recorded

                                  </button>

                                ) : (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openVisitForm(
                                        appointment
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                                  >

                                    <Sparkles
                                      size={15}
                                    />

                                    Generate AI Summary

                                  </button>

                                )}

                              </div>

                            )}


                            {/* CANCELLED INFO */}

                            {cancelled && (

                              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">

                                This appointment was cancelled.

                              </div>

                            )}

                          </div>

                        );
                      }
                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  RIGHT SIDE
              ================================================= */}

              <div className="space-y-4">


                {/* =================================================
                    CLINIC STATUS
                ================================================= */}

                <div className="panel p-4">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        Overview
                      </div>

                      <h3 className="mt-1 text-lg font-semibold">
                        Clinic status
                      </h3>

                    </div>

                    <TrendingUp
                      size={16}
                      className="text-[var(--primary)]"
                    />

                  </div>


                  <div className="space-y-5">

                    {/* COMPLETION */}

                    <div>

                      <div className="mb-1.5 flex items-center justify-between text-[11px]">

                        <span className="text-[var(--muted)]">
                          Visit completion
                        </span>

                        <span className="font-semibold">
                          {stats.completionRate}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[var(--subtle)]">

                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                          style={{
                            width: `${stats.completionRate}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* ACTIVE APPOINTMENTS */}

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-3">

                      <div className="flex items-center justify-between">

                        <span className="text-xs text-[var(--muted)]">
                          Active appointments
                        </span>

                        <span className="text-lg font-semibold">
                          {stats.scheduled}
                        </span>

                      </div>

                    </div>


                    {/* PATIENT LOAD */}

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-3">

                      <div className="flex items-center justify-between">

                        <span className="text-xs text-[var(--muted)]">
                          Patient load
                        </span>

                        <span className="text-lg font-semibold">
                          {stats.uniquePatients}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    PRACTICE DETAILS
                ================================================= */}

                <div className="panel p-4">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        Practice
                      </div>

                      <h3 className="mt-1 text-lg font-semibold">
                        Practice details
                      </h3>

                    </div>

                    <Stethoscope
                      size={16}
                      className="text-[var(--primary)]"
                    />

                  </div>


                  <div className="space-y-3 text-sm">

                    <InfoRow
                      label="Specialization"
                      value={specialization}
                    />

                    <InfoRow
                      label="Hospital"
                      value={hospital}
                    />

                    <InfoRow
                      label="Experience"
                      value={
                        experience !==
                          null &&
                        experience !==
                          undefined &&
                        experience !== ""
                          ? `${experience} ${
                              Number(
                                experience
                              ) === 1
                                ? "year"
                                : "years"
                            }`
                          : "—"
                      }
                    />

                  </div>

                </div>


                {/* =================================================
                    QUICK SUMMARY
                ================================================= */}

                <div className="panel p-4">

                  <div className="mb-3">

                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Summary
                    </div>

                    <h3 className="mt-1 text-lg font-semibold">
                      Practice snapshot
                    </h3>

                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    <MiniStat
                      label="Today"
                      value={
                        todaysAppointments.length
                      }
                    />

                    <MiniStat
                      label="Completed"
                      value={
                        stats.completed
                      }
                    />

                    <MiniStat
                      label="Pending"
                      value={
                        stats.pending
                      }
                    />

                    <MiniStat
                      label="Cancelled"
                      value={
                        stats.cancelled
                      }
                    />

                  </div>

                </div>

              </div>

            </section>

          </>

        )}

      </div>


      {/* =====================================================
          AI SUMMARY MODAL
      ===================================================== */}

      {visitForm.appointmentId && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeVisitForm}
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--bg)] p-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">

                    <Sparkles
                      size={20}
                    />

                  </div>

                  <div>

                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      AI-assisted documentation
                    </div>

                    <h3 className="mt-1 text-xl font-semibold">
                      Generate Visit Summary
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Add the clinical notes and
                      care plan for this completed
                      appointment.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={visitLoading}
                  onClick={
                    closeVisitForm
                  }
                  className="rounded-xl p-2 text-[var(--muted)] transition hover:bg-[var(--subtle)] disabled:opacity-50"
                >

                  <X size={18} />

                </button>

              </div>

            </div>


            {/* FORM */}

            <div className="space-y-5 p-5">

              {/* CLINICAL NOTES */}

              <div>

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">

                  Clinical notes

                  <span className="ml-1 text-rose-500">
                    *
                  </span>

                </label>

                <textarea
                  rows={7}
                  value={
                    visitForm.clinical_notes
                  }
                  onChange={(event) =>
                    setVisitForm(
                      (current) => ({
                        ...current,
                        clinical_notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Enter diagnosis, observations, symptoms, treatment provided, patient response, and follow-up recommendations..."
                  className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 text-sm leading-6 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />

                <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted)]">

                  <span>
                    Required
                  </span>

                  <span>
                    {
                      visitForm
                        .clinical_notes
                        .length
                    }{" "}
                    characters
                  </span>

                </div>

              </div>


              {/* PRESCRIPTION */}

              <div>

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">

                  Prescription / care plan

                </label>

                <textarea
                  rows={4}
                  value={
                    visitForm.prescription
                  }
                  onChange={(event) =>
                    setVisitForm(
                      (current) => ({
                        ...current,
                        prescription:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional: medications, dosage, lifestyle changes, tests, or follow-up plan..."
                  className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 text-sm leading-6 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />

              </div>


              {/* AI INFO */}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">

                <div className="flex gap-3">

                  <Sparkles
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300"
                  />

                  <div>

                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                      AI-assisted summary
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-blue-700 dark:text-blue-300">
                      Your clinical notes will be
                      processed by the backend AI
                      service to create a structured
                      visit summary.
                    </p>

                  </div>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={
                    visitLoading
                  }
                  onClick={
                    closeVisitForm
                  }
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--subtle)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    visitLoading ||
                    !visitForm.clinical_notes.trim()
                  }
                  onClick={
                    submitVisitSummary
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Sparkles
                    size={16}
                    className={
                      visitLoading
                        ? "animate-pulse"
                        : ""
                    }
                  />

                  {visitLoading
                    ? "Generating..."
                    : "Generate AI Summary"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  delta,
  tone,
  icon: Icon,
}) {
  return (
    <div className="panel p-4">

      <div className="flex items-start justify-between gap-3">

        <div
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone].iconWrap}`}
        >

          <Icon
            size={18}
            className={
              toneClasses[tone].iconColor
            }
          />

        </div>

        <span className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {delta}
        </span>

      </div>

      <div className="mt-5">

        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {label}
        </div>

        <div
          className={`mt-1 text-[28px] font-semibold tracking-tight ${toneClasses[tone].text}`}
        >
          {value}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2.5">

      <span className="text-[var(--muted)]">
        {label}
      </span>

      <span className="max-w-[58%] text-right font-semibold">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-3">

      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>

      <div className="mt-1 text-xl font-semibold">
        {value}
      </div>

    </div>
  );
}


/* =========================================================
   EMPTY APPOINTMENTS
========================================================= */

function EmptyAppointments() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--subtle)] p-8 text-center">

      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">

        <CalendarDays
          size={18}
        />

      </div>

      <div className="text-base font-semibold">
        No appointments yet
      </div>

      <div className="mt-1 text-sm text-[var(--muted)]">
        Your scheduled patient visits
        will appear here.
      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <div className="space-y-4">

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {Array.from({
          length: 4,
        }).map((_, index) => (

          <div
            key={index}
            className="panel p-4"
          >

            <div className="skeleton h-10 w-10 rounded-xl" />

            <div className="skeleton mt-5 h-3 w-28 rounded" />

            <div className="skeleton mt-2 h-8 w-16 rounded" />

          </div>

        ))}

      </div>


      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">

        <div className="panel p-5">

          <div className="skeleton h-5 w-48 rounded" />

          <div className="mt-5 space-y-3">

            {Array.from({
              length: 4,
            }).map((_, index) => (

              <div
                key={index}
                className="rounded-2xl border border-[var(--border)] p-4"
              >

                <div className="flex items-center gap-3">

                  <div className="skeleton h-11 w-11 rounded-2xl" />

                  <div className="flex-1">

                    <div className="skeleton h-4 w-32 rounded" />

                    <div className="skeleton mt-2 h-3 w-44 rounded" />

                  </div>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <div className="skeleton h-12 rounded-xl" />
                  <div className="skeleton h-12 rounded-xl" />
                  <div className="skeleton h-12 rounded-xl" />

                </div>

              </div>

            ))}

          </div>

        </div>


        <div className="space-y-4">

          <div className="panel p-5">

            <div className="skeleton h-5 w-36 rounded" />

            <div className="skeleton mt-5 h-3 w-full rounded" />

            <div className="skeleton mt-5 h-12 w-full rounded-xl" />

            <div className="skeleton mt-3 h-12 w-full rounded-xl" />

          </div>

          <div className="panel p-5">

            <div className="skeleton h-5 w-36 rounded" />

            <div className="mt-4 space-y-3">

              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


export default DoctorDashboard;
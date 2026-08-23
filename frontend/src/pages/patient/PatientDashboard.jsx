import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserRound,
  UsersRound,
  X,
  Sparkles,
  Pill,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getMyAppointments,
  getVisit,
  getNotifications,
} from "../../api/api";


// =========================================================
// HELPERS
// =========================================================

function normalizeStatus(value) {
  const status = String(value || "scheduled")
    .trim()
    .toLowerCase();

  if (
    status === "scheduled" ||
    status === "confirmed"
  ) {
    return "Scheduled";
  }

  if (
    status === "pending" ||
    status === "awaiting intake"
  ) {
    return "Pending";
  }

  if (
    status === "completed" ||
    status === "finished" ||
    status === "done"
  ) {
    return "Completed";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "Cancelled";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}


function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}


// =========================================================
// COMPONENT
// =========================================================

function PatientDashboard() {

  const { user, logout } = useAuth();

  // =======================================================
  // STATE
  // =======================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [search, setSearch] = useState("");

  const [appointments, setAppointments] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [visits, setVisits] = useState({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedVisit, setSelectedVisit] =
    useState(null);


  // =======================================================
  // THEME
  // =======================================================

  useEffect(() => {

    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );

  }, [darkMode]);


  // =======================================================
  // LOAD DASHBOARD
  // =======================================================

  useEffect(() => {

    async function loadDashboard() {

      try {

        setLoading(true);
        setError("");

        const [
          appointmentsData,
          notificationsData,
        ] = await Promise.all([
          getMyAppointments(),
          getNotifications(),
        ]);


        const appointmentList =
          Array.isArray(appointmentsData)
            ? appointmentsData
            : [];


        setAppointments(
          appointmentList
        );


        setNotifications(
          Array.isArray(notificationsData)
            ? notificationsData
            : []
        );


        // ===============================================
        // LOAD VISITS FOR COMPLETED APPOINTMENTS
        // ===============================================

        const completedAppointments =
          appointmentList.filter(
            (appointment) =>
              String(
                appointment.status || ""
              ).toLowerCase() ===
              "completed"
          );


        const visitResults =
          await Promise.allSettled(
            completedAppointments.map(
              async (appointment) => {

                const appointmentId =
                  appointment.appointment_id ||
                  appointment.id;

                if (!appointmentId) {
                  return null;
                }

                try {

                  const visit =
                    await getVisit(
                      appointmentId
                    );

                  return {
                    appointmentId,
                    visit,
                  };

                } catch (visitError) {

                  console.error(
                    `Unable to load visit ${appointmentId}`,
                    visitError
                  );

                  return null;
                }
              }
            )
          );


        const visitMap = {};


        visitResults.forEach(
          (result) => {

            if (
              result.status === "fulfilled" &&
              result.value
            ) {

              visitMap[
                result.value.appointmentId
              ] = result.value.visit;

            }

          }
        );


        setVisits(visitMap);

      } catch (err) {

        console.error(err);

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load your dashboard."
        );

      } finally {

        setLoading(false);

      }

    }


    loadDashboard();

  }, []);


  // =======================================================
  // USER DETAILS
  // =======================================================

  const patientName =
    user?.full_name ||
    user?.name ||
    "Patient";


  const firstName =
    patientName.split(" ")[0];


  const initials =
    patientName
      .split(" ")
      .map((name) =>
        name.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  // =======================================================
  // APPOINTMENT CALCULATIONS
  // =======================================================

  const upcomingAppointments =
    useMemo(() => {

      return appointments
        .filter((appointment) => {

          const status =
            String(
              appointment.status || ""
            ).toLowerCase();

          return (
            status !== "completed" &&
            status !== "cancelled" &&
            status !== "canceled"
          );

        })
        .sort((a, b) => {

          const dateA =
            new Date(
              a.appointment_time ||
              a.appointment_time_ist
            ).getTime();

          const dateB =
            new Date(
              b.appointment_time ||
              b.appointment_time_ist
            ).getTime();

          return dateA - dateB;

        });

    }, [appointments]);


  const nextAppointment =
    upcomingAppointments[0] || null;


  const completedAppointments =
    appointments.filter(
      (appointment) =>
        String(
          appointment.status || ""
        ).toLowerCase() ===
        "completed"
    );


  // =======================================================
  // METRICS
  // =======================================================

  const metrics = [

    {
      title: "Total Appointments",
      value: appointments.length,
      change: "",
      label: "all appointments",
      icon: CalendarDays,
      color: "blue",
    },

    {
      title: "Upcoming",
      value: upcomingAppointments.length,
      change: nextAppointment
        ? "Next"
        : "",
      label: nextAppointment
        ? formatDate(
            nextAppointment.appointment_time ||
            nextAppointment.appointment_time_ist
          )
        : "No upcoming appointment",
      icon: Clock3,
      color: "amber",
    },

    {
      title: "Completed",
      value: completedAppointments.length,
      change:
        appointments.length > 0
          ? `${Math.round(
              (completedAppointments.length /
                appointments.length) *
                100
            )}%`
          : "0%",
      label: "completion rate",
      icon: CheckCircle2,
      color: "emerald",
    },

    {
      title: "Notifications",
      value: notifications.length,
      change: "",
      label: "latest updates",
      icon: Bell,
      color: "rose",
    },

  ];


  // =======================================================
  // SEARCH
  // =======================================================

  const filteredAppointments =
    appointments.filter(
      (appointment) => {

        if (!search.trim()) {
          return true;
        }

        const query =
          search.toLowerCase();

        return (
          appointment.doctor_name
            ?.toLowerCase()
            .includes(query) ||

          appointment.specialization
            ?.toLowerCase()
            .includes(query) ||

          appointment.reason
            ?.toLowerCase()
            .includes(query) ||

          appointment.status
            ?.toLowerCase()
            .includes(query)
        );

      }
    );


  // =======================================================
  // COLORS
  // =======================================================

  function getColorClasses(color) {

    const colors = {

      blue: {
        box:
          "bg-blue-50 dark:bg-blue-500/10",
        icon:
          "text-blue-600 dark:text-blue-400",
        number:
          "text-blue-700 dark:text-blue-400",
      },

      amber: {
        box:
          "bg-amber-50 dark:bg-amber-500/10",
        icon:
          "text-amber-600 dark:text-amber-400",
        number:
          "text-amber-700 dark:text-amber-400",
      },

      emerald: {
        box:
          "bg-emerald-50 dark:bg-emerald-500/10",
        icon:
          "text-emerald-600 dark:text-emerald-400",
        number:
          "text-emerald-700 dark:text-emerald-400",
      },

      rose: {
        box:
          "bg-rose-50 dark:bg-rose-500/10",
        icon:
          "text-rose-600 dark:text-rose-400",
        number:
          "text-rose-700 dark:text-rose-400",
      },

    };

    return colors[color];

  }


  // =======================================================
  // NOTIFICATION COLORS
  // =======================================================

  function getNotificationClasses(type) {

    if (
      String(type || "")
        .toLowerCase()
        .includes("success")
    ) {

      return (
        "bg-emerald-50 text-emerald-600 " +
        "dark:bg-emerald-500/10 dark:text-emerald-400"
      );

    }

    if (
      String(type || "")
        .toLowerCase()
        .includes("warning")
    ) {

      return (
        "bg-amber-50 text-amber-600 " +
        "dark:bg-amber-500/10 dark:text-amber-400"
      );

    }

    return (
      "bg-blue-50 text-blue-600 " +
      "dark:bg-blue-500/10 dark:text-blue-400"
    );

  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="min-h-screen bg-[#f7f9fc] text-slate-900 dark:bg-[#080d18] dark:text-white">


      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {sidebarOpen && (

        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />

      )}


      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[260px] flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          dark:border-slate-800
          dark:bg-[#0d1422]
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* LOGO */}

        <div className="flex h-[76px] items-center border-b border-slate-100 px-6 dark:border-slate-800">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">

              <Activity
                size={21}
                strokeWidth={2.5}
              />

            </div>

            <div>

              <div className="text-[15px] font-bold tracking-tight">
                HealthCare
              </div>

              <div className="text-[10px] font-medium text-slate-400">
                APPOINTMENT MANAGER
              </div>

            </div>

          </div>


          <button
            className="ml-auto rounded-lg p-2 text-slate-400 lg:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={18} />
          </button>

        </div>


        {/* NAVIGATION */}

        <div className="flex-1 px-4 py-7">

          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Main Menu
          </div>


          <div className="space-y-1">

            <button
              className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-3 py-3 text-left text-[13px] font-semibold text-white shadow-md shadow-blue-600/20"
            >

              <Home size={18} />

              Dashboard

            </button>


            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >

              <Stethoscope size={18} />

              Find Doctors

            </button>


            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >

              <CalendarDays size={18} />

              My Appointments

            </button>


            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >

              <Bell size={18} />

              Notifications

              {notifications.length > 0 && (

                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>

              )}

            </button>

          </div>


          <div className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Account
          </div>


          <div className="space-y-1">

            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">

              <UserRound size={18} />

              Profile

            </button>


            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">

              <Settings size={18} />

              Settings

            </button>

          </div>

        </div>


        {/* USER */}

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">

          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">

                {initials}

              </div>


              <div className="min-w-0 flex-1">

                <div className="truncate text-xs font-bold">
                  {patientName}
                </div>

                <div className="mt-0.5 text-[10px] text-slate-400">
                  Patient Account
                </div>

              </div>


              <button
                onClick={logout}
                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-500 dark:hover:bg-slate-700"
                title="Logout"
              >

                <LogOut size={16} />

              </button>

            </div>

          </div>

        </div>

      </aside>


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div className="lg:pl-[260px]">


        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[#0d1422]/90">

          <button
            className="mr-3 rounded-xl p-2 text-slate-500 lg:hidden"
            onClick={() =>
              setSidebarOpen(true)
            }
          >

            <Menu size={21} />

          </button>


          {/* SEARCH */}

          <div className="relative w-full max-w-[430px]">

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search appointments..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-800/70 dark:text-white"
            />

          </div>


          <div className="ml-auto flex items-center gap-1">

            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >

              <Bell size={19} />

              {notifications.length > 0 && (

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0d1422]" />

              )}

            </button>


            <button
              onClick={() =>
                setDarkMode(
                  (value) => !value
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >

              {darkMode ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}

            </button>


            <div className="ml-3 hidden items-center gap-2 sm:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">

                {initials}

              </div>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <main className="mx-auto max-w-[1450px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">


          {/* WELCOME */}

          <div className="mb-8">

            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Patient Dashboard
            </div>

            <h1 className="mt-2 text-[26px] font-bold tracking-tight sm:text-[30px]">
              Welcome back, {firstName}
            </h1>

            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Here's your healthcare overview for today.
            </p>

          </div>


          {/* ERROR */}

          {error && (

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">

              <AlertCircle size={18} />

              <span>{error}</span>

            </div>

          )}


          {/* LOADING */}

          {loading ? (

            <div className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {Array.from({
                  length: 4,
                }).map((_, index) => (

                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                  />

                ))}

              </div>


              <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

            </div>

          ) : (

            <>


              {/* ================================================= */}
              {/* METRICS */}
              {/* ================================================= */}

              <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {metrics.map(
                  (metric) => {

                    const Icon =
                      metric.icon;

                    const colors =
                      getColorClasses(
                        metric.color
                      );

                    return (

                      <div
                        key={
                          metric.title
                        }
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1422]"
                      >

                        <div className="flex items-start justify-between">

                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.box}`}
                          >

                            <Icon
                              size={19}
                              className={
                                colors.icon
                              }
                            />

                          </div>


                          <span className="text-[10px] font-semibold text-slate-400">

                            {
                              metric.change
                            }

                          </span>

                        </div>


                        <div className="mt-5">

                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">

                            {
                              metric.title
                            }

                          </div>


                          <div
                            className={`mt-1 text-[27px] font-bold tracking-tight ${colors.number}`}
                          >

                            {
                              metric.value
                            }

                          </div>


                          <div className="mt-0.5 text-[10px] text-slate-400">

                            {
                              metric.label
                            }

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>


              {/* ================================================= */}
              {/* NEXT APPOINTMENT + NOTIFICATIONS */}
              {/* ================================================= */}

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">


                {/* NEXT APPOINTMENT */}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1422]">

                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">

                    <div>

                      <h2 className="text-sm font-bold">
                        Next Appointment
                      </h2>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Your upcoming healthcare visit
                      </p>

                    </div>


                    {nextAppointment && (

                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        {
                          normalizeStatus(
                            nextAppointment.status
                          )
                        }

                      </div>

                    )}

                  </div>


                  <div className="p-5">

                    {!nextAppointment ? (

                      <div className="py-10 text-center">

                        <CalendarDays
                          size={30}
                          className="mx-auto text-slate-300"
                        />

                        <div className="mt-3 text-sm font-semibold">
                          No upcoming appointments
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Book an appointment with a doctor.
                        </p>

                      </div>

                    ) : (

                      <>

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">


                          {/* DOCTOR */}

                          <div className="flex items-center gap-4">

                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                              <Stethoscope size={25} />

                            </div>


                            <div>

                              <h3 className="text-sm font-bold">

                                {
                                  nextAppointment.doctor_name ||
                                  nextAppointment.doctor?.name ||
                                  "Doctor"
                                }

                              </h3>


                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                                {
                                  nextAppointment.specialization ||
                                  nextAppointment.doctor_specialization ||
                                  "Specialist"
                                }

                              </p>


                              <div className="mt-2 flex items-center gap-1 text-[9px] font-medium text-slate-400">

                                <ShieldCheck size={12} />

                                Verified Specialist

                              </div>

                            </div>

                          </div>


                          {/* DATE */}

                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">

                            <div className="flex items-center gap-2 text-[11px] font-semibold">

                              <CalendarDays
                                size={14}
                                className="text-blue-500"
                              />

                              {
                                formatDate(
                                  nextAppointment.appointment_time ||
                                  nextAppointment.appointment_time_ist
                                )
                              }

                            </div>


                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">

                              <Clock3 size={14} />

                              {
                                formatTime(
                                  nextAppointment.appointment_time ||
                                  nextAppointment.appointment_time_ist
                                )
                              }

                            </div>

                          </div>

                        </div>


                        <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">

                          <button
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >

                            View Details

                            <ChevronRight
                              size={14}
                            />

                          </button>


                          <button
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
                          >

                            Manage

                            <CalendarDays
                              size={14}
                            />

                          </button>

                        </div>

                      </>

                    )}

                  </div>

                </section>


                {/* NOTIFICATIONS */}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1422]">

                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">

                    <div>

                      <h2 className="text-sm font-bold">
                        Recent Notifications
                      </h2>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Latest updates and alerts
                      </p>

                    </div>

                  </div>


                  <div className="divide-y divide-slate-100 dark:divide-slate-800">

                    {notifications.length === 0 ? (

                      <div className="p-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>

                    ) : (

                      notifications
                        .slice(0, 4)
                        .map(
                          (
                            notification,
                            index
                          ) => {

                            return (

                              <div
                                key={
                                  notification.id ||
                                  index
                                }
                                className="flex gap-3 px-5 py-4"
                              >

                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getNotificationClasses(
                                    notification.type
                                  )}`}
                                >

                                  <Bell size={16} />

                                </div>


                                <div className="min-w-0 flex-1">

                                  <div className="flex justify-between gap-3">

                                    <div className="text-[11px] font-bold">

                                      {
                                        notification.title ||
                                        "Notification"
                                      }

                                    </div>

                                  </div>


                                  <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">

                                    {
                                      notification.message ||
                                      notification.text ||
                                      notification.content ||
                                      "You have a new notification."
                                    }

                                  </p>

                                </div>

                              </div>

                            );

                          }
                        )

                    )}

                  </div>

                </section>

              </div>


              {/* ================================================= */}
              {/* COMPLETED VISITS */}
              {/* ================================================= */}

              <section className="mt-7">

                <div className="mb-4">

                  <div className="flex items-center gap-2">

                    <Sparkles
                      size={17}
                      className="text-blue-600 dark:text-blue-400"
                    />

                    <h2 className="text-sm font-bold">
                      Post-Visit Summaries
                    </h2>

                  </div>


                  <p className="mt-1 text-[10px] text-slate-400">
                    AI-generated summaries based on your doctor's notes and prescription
                  </p>

                </div>


                {completedAppointments.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#0d1422]">

                    <FileText
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <div className="mt-3 text-sm font-semibold">
                      No completed visits
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Your post-visit summaries will appear here after your appointments.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-4">

                    {completedAppointments.map(
                      (appointment) => {

                        const appointmentId =
                          appointment.appointment_id ||
                          appointment.id;

                        const visit =
                          visits[
                            appointmentId
                          ];


                        return (

                          <div
                            key={appointmentId}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1422]"
                          >

                            {/* VISIT HEADER */}

                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

                              <div className="flex items-center gap-4">

                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                                  <Stethoscope
                                    size={21}
                                  />

                                </div>


                                <div>

                                  <h3 className="text-sm font-bold">

                                    {
                                      appointment.doctor_name ||
                                      appointment.doctor?.name ||
                                      "Doctor"
                                    }

                                  </h3>


                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">

                                    <span className="flex items-center gap-1">

                                      <CalendarDays
                                        size={12}
                                      />

                                      {
                                        formatDate(
                                          appointment.appointment_time ||
                                          appointment.appointment_time_ist
                                        )
                                      }

                                    </span>


                                    <span className="flex items-center gap-1">

                                      <CheckCircle2
                                        size={12}
                                        className="text-emerald-500"
                                      />

                                      Completed

                                    </span>

                                  </div>

                                </div>

                              </div>


                              {visit && (

                                <button
                                  onClick={() =>
                                    setSelectedVisit(
                                      {
                                        appointment,
                                        visit,
                                      }
                                    )
                                  }
                                  className="rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-semibold text-white hover:bg-blue-700"
                                >

                                  View Summary

                                  <ChevronRight
                                    size={14}
                                    className="ml-1 inline"
                                  />

                                </button>

                              )}

                            </div>


                            {/* SUMMARY */}

                            <div className="p-5">

                              {!visit ? (

                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">

                                  <Activity
                                    size={16}
                                  />

                                  Loading your post-visit summary...

                                </div>

                              ) : (

                                <>

                                  {/* AI SUMMARY */}

                                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">

                                    <div className="mb-2 flex items-center gap-2">

                                      <Sparkles
                                        size={15}
                                        className="text-blue-600 dark:text-blue-400"
                                      />

                                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-400">

                                        AI Patient Summary

                                      </span>

                                    </div>


                                    <div className="whitespace-pre-wrap text-xs leading-5 text-slate-700 dark:text-slate-300">

                                      {
                                        visit.ai_summary ||
                                        visit.patient_summary ||
                                        "Summary unavailable."
                                      }

                                    </div>

                                  </div>


                                  {/* PRESCRIPTION */}

                                  {visit.prescription && (

                                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">

                                      <div className="mb-2 flex items-center gap-2">

                                        <Pill
                                          size={15}
                                          className="text-emerald-600 dark:text-emerald-400"
                                        />

                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">

                                          Prescription

                                        </span>

                                      </div>


                                      <div className="whitespace-pre-wrap text-xs leading-5 text-slate-700 dark:text-slate-300">

                                        {
                                          visit.prescription
                                        }

                                      </div>

                                    </div>

                                  )}

                                </>

                              )}

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                )}

              </section>


              {/* ================================================= */}
              {/* ALL APPOINTMENTS */}
              {/* ================================================= */}

              <section className="mt-7">

                <div className="mb-4">

                  <h2 className="text-sm font-bold">
                    My Appointments
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Your complete appointment history
                  </p>

                </div>


                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0d1422]">

                  {filteredAppointments.length === 0 ? (

                    <div className="p-8 text-center text-xs text-slate-400">
                      No appointments found.
                    </div>

                  ) : (

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">

                      {filteredAppointments.map(
                        (appointment) => {

                          const status =
                            normalizeStatus(
                              appointment.status
                            );


                          return (

                            <div
                              key={
                                appointment.appointment_id ||
                                appointment.id
                              }
                              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div className="flex items-center gap-4">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                                  <Stethoscope
                                    size={19}
                                  />

                                </div>


                                <div>

                                  <div className="text-sm font-bold">

                                    {
                                      appointment.doctor_name ||
                                      appointment.doctor?.name ||
                                      "Doctor"
                                    }

                                  </div>


                                  <div className="mt-1 text-[10px] text-slate-400">

                                    {
                                      appointment.specialization ||
                                      appointment.doctor_specialization ||
                                      "Specialist"
                                    }

                                  </div>


                                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">

                                    <span className="flex items-center gap-1">

                                      <CalendarDays
                                        size={12}
                                      />

                                      {
                                        formatDate(
                                          appointment.appointment_time ||
                                          appointment.appointment_time_ist
                                        )
                                      }

                                    </span>


                                    <span className="flex items-center gap-1">

                                      <Clock3
                                        size={12}
                                      />

                                      {
                                        formatTime(
                                          appointment.appointment_time ||
                                          appointment.appointment_time_ist
                                        )
                                      }

                                    </span>

                                  </div>

                                </div>

                              </div>


                              <span
                                className={`
                                  inline-flex w-fit rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider
                                  ${
                                    status ===
                                    "Completed"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                      : status ===
                                        "Cancelled"
                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                        : status ===
                                          "Pending"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                          : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                  }
                                `}
                              >

                                {status}

                              </span>

                            </div>

                          );

                        }
                      )}

                    </div>

                  )}

                </div>

              </section>


              {/* ================================================= */}
              {/* QUICK ACCESS */}
              {/* ================================================= */}

              <section className="mt-7">

                <div className="mb-4">

                  <h2 className="text-sm font-bold">
                    Quick Access
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Frequently used services
                  </p>

                </div>


                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <button className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0d1422]">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                      <UsersRound size={18} />

                    </div>


                    <div className="flex-1">

                      <div className="text-[11px] font-bold">
                        Find a Doctor
                      </div>

                      <div className="mt-1 text-[10px] text-slate-400">
                        Browse specialists
                      </div>

                    </div>


                    <ChevronRight
                      size={15}
                      className="text-slate-300"
                    />

                  </button>


                  <button className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0d1422]">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">

                      <FileText size={18} />

                    </div>


                    <div className="flex-1">

                      <div className="text-[11px] font-bold">
                        Medical Records
                      </div>

                      <div className="mt-1 text-[10px] text-slate-400">
                        View your records
                      </div>

                    </div>


                    <ChevronRight
                      size={15}
                      className="text-slate-300"
                    />

                  </button>


                  <button className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-amber-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0d1422]">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">

                      <Settings size={18} />

                    </div>


                    <div className="flex-1">

                      <div className="text-[11px] font-bold">
                        Account Settings
                      </div>

                      <div className="mt-1 text-[10px] text-slate-400">
                        Manage preferences
                      </div>

                    </div>


                    <ChevronRight
                      size={15}
                      className="text-slate-300"
                    />

                  </button>

                </div>

              </section>

            </>

          )}

        </main>

      </div>


      {/* ===================================================== */}
      {/* VISIT DETAIL MODAL */}
      {/* ===================================================== */}

      {selectedVisit && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedVisit(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d1422]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1422]">

              <div>

                <div className="flex items-center gap-2">

                  <Sparkles
                    size={17}
                    className="text-blue-600 dark:text-blue-400"
                  />

                  <h2 className="text-lg font-bold">
                    Post-Visit Summary
                  </h2>

                </div>


                <p className="mt-1 text-xs text-slate-400">

                  {
                    selectedVisit
                      .appointment
                      .doctor_name ||
                    "Doctor"
                  }

                </p>

              </div>


              <button
                onClick={() =>
                  setSelectedVisit(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >

                <X size={18} />

              </button>

            </div>


            <div className="space-y-5 p-5">


              {/* AI SUMMARY */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">

                <div className="mb-3 flex items-center gap-2">

                  <Sparkles
                    size={16}
                    className="text-blue-600 dark:text-blue-400"
                  />

                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Patient-Friendly AI Summary
                  </h3>

                </div>


                <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">

                  {
                    selectedVisit
                      .visit
                      .ai_summary ||
                    selectedVisit
                      .visit
                      .patient_summary ||
                    "Summary unavailable."
                  }

                </div>

              </div>


              {/* PRESCRIPTION */}

              {selectedVisit
                .visit
                .prescription && (

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">

                  <div className="mb-3 flex items-center gap-2">

                    <Pill
                      size={16}
                      className="text-emerald-600 dark:text-emerald-400"
                    />

                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Prescription
                    </h3>

                  </div>


                  <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">

                    {
                      selectedVisit
                        .visit
                        .prescription
                    }

                  </div>

                </div>

              )}


              {/* VISIT DATE */}

              <div className="flex items-center gap-2 text-xs text-slate-400">

                <CalendarDays
                  size={14}
                />

                Visit date:

                <span className="font-semibold text-slate-600 dark:text-slate-300">

                  {
                    formatDate(
                      selectedVisit
                        .appointment
                        .appointment_time ||
                      selectedVisit
                        .appointment
                        .appointment_time_ist
                    )
                  }

                </span>

              </div>


              <div className="rounded-xl bg-slate-50 p-4 text-[10px] leading-4 text-slate-400 dark:bg-slate-800/50">

                This AI-generated summary is based only on information entered by your healthcare provider. Follow your provider's instructions and contact the clinic if you have questions.

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default PatientDashboard;
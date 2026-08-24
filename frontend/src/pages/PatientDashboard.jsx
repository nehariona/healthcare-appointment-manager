import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  getMyAppointments,
  getNotifications,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const statusClasses = {
  confirmed: "status-confirmed",
  scheduled: "status-confirmed",
  rescheduled: "status-confirmed",
  pending: "status-pending",
  completed: "status-success",
  cancelled: "status-cancelled",
  canceled: "status-cancelled",
  default: "status-default",
};

function formatDateLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(value) {
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

function formatRelativeTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMinutes = Math.max(0, (Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 60) return `${Math.round(diffMinutes)}m ago`;

  const diffHours = diffMinutes / 60;
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;

  const diffDays = diffHours / 24;
  if (diffDays < 7) return `${Math.round(diffDays)}d ago`;

  return formatDateLabel(value);
}

function normalizeStatus(status) {
  const value = (status || "scheduled").toString().trim().toLowerCase();

  if (["confirmed", "scheduled", "rescheduled"].includes(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  if (["pending", "awaiting intake"].includes(value)) return "Pending";
  if (["completed", "finished", "done"].includes(value)) return "Completed";
  if (["cancelled", "canceled"].includes(value)) return "Cancelled";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PatientDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [appointmentsData, notificationsData] = await Promise.all([
          getMyAppointments(),
          getNotifications(),
        ]);

        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : []
        );
        setNotificationItems(
          Array.isArray(notificationsData) ? notificationsData : []
        );
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load your dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const patientName = user?.full_name || user?.name || "Patient";
  const firstName = patientName.split(" ")[0];
  const initials = patientName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";

  // Dynamic count of unread/pending notifications
  const unreadCount = useMemo(() => {
    return notificationItems.filter(
      (item) => item.status === "pending" || !item.sent_at
    ).length;
  }, [notificationItems]);

  const navItems = useMemo(
    () => [
      { label: "Overview", icon: LayoutGrid, route: "/dashboard" },
      { label: "Appointments", icon: CalendarDays, route: "/appointments" },
      { label: "Find Doctors", icon: Stethoscope, route: "/doctors" },
      {
        label: "Notifications",
        icon: Bell,
        badge: unreadCount > 0 ? unreadCount : null,
        route: "/notifications",
      },
      { label: "My Profile", icon: UserRound, route: "/profile" },
    ],
    [unreadCount]
  );

  const appointmentRows = useMemo(() => {
    return appointments
      .map((item) => {
        const dateValue =
          item.appointment_time ||
          item.appointment_time_ist ||
          item.date;
        const dateObj = new Date(dateValue);
        const normalizedStatus = normalizeStatus(item.status);

        return {
          id: item.appointment_id || item.id,
          doctor: item.doctor_name || "Doctor",
          specialty: item.reason || "Consultation",
          time: item.appointment_time_ist || formatTimeLabel(dateValue),
          date: dateValue,
          rawDate: dateObj,
          status: normalizedStatus,
          statusKey: (item.status || "scheduled").toLowerCase(),
          location: item.google_calendar_event_id
            ? "Google Meet / Sync"
            : "Clinic Visit",
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointmentRows;

    const query = search.toLowerCase();

    return appointmentRows.filter((item) => {
      return (
        item.doctor.toLowerCase().includes(query) ||
        item.specialty.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    });
  }, [search, appointmentRows]);

  const stats = useMemo(() => {
    const total = appointmentRows.length;
    const upcoming = appointmentRows.filter(
      (item) =>
        !["Completed", "Cancelled"].includes(item.status) &&
        new Date(item.date) >= Date.now()
    ).length;
    const completed = appointmentRows.filter(
      (item) => item.status === "Completed"
    ).length;

    return [
      {
        label: "Total appointments",
        value: String(total),
        delta: total > 0 ? `${total} booked` : "No visits yet",
        tone: "blue",
        icon: CalendarDays,
      },
      {
        label: "Upcoming",
        value: String(upcoming),
        delta:
          upcoming === 1
            ? "1 visit scheduled"
            : `${upcoming} visits scheduled`,
        tone: "amber",
        icon: Clock3,
      },
      {
        label: "Completed",
        value: String(completed),
        delta:
          total > 0
            ? `${completed} finished`
            : "0 completed",
        tone: "emerald",
        icon: CheckCircle2,
      },
      {
        label: "Notifications",
        value: String(notificationItems.length),
        delta:
          unreadCount > 0
            ? `${unreadCount} new alerts`
            : "All caught up",
        tone: "rose",
        icon: Bell,
      },
    ];
  }, [appointmentRows, notificationItems, unreadCount]);

  const nextAppointment = useMemo(() => {
    if (!appointmentRows.length) return null;

    const future = appointmentRows.filter(
      (item) =>
        !["Completed", "Cancelled"].includes(item.status) &&
        new Date(item.date) >= Date.now()
    );

    return future[0] || null;
  }, [appointmentRows]);

  const recentNotifications = useMemo(() => {
    return notificationItems.slice(0, 4).map((item) => {
      const type = (item.notification_type || "info").toLowerCase();
      let tone = "info";

      if (type.includes("cancel")) tone = "rose";
      else if (type.includes("reschedule") || type.includes("reminder"))
        tone = "warning";
      else if (
        type.includes("summary") ||
        type.includes("confirm") ||
        type.includes("booking")
      )
        tone = "success";

      return {
        id: item.id,
        title: item.subject || item.notification_type || "Notification",
        body: item.body || "No details provided.",
        time: formatRelativeTime(item.created_at),
        tone,
      };
    });
  }, [notificationItems]);

  function handleNavigation(target) {
    if (!target) return;
    navigate(target);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="mx-auto max-w-[1600px] p-3 sm:p-4 xl:p-5">
        <div className="grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* ================= SIDEBAR ================= */}
          <aside
            className={`panel fixed left-3 top-3 z-50 h-[calc(100vh-1.5rem)] w-[260px] p-0 transition-transform duration-200 xl:sticky xl:left-auto xl:top-auto xl:translate-x-0 ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-[120%] xl:translate-x-0"
            }`}
          >
            <div className="flex h-[74px] items-center justify-between border-b border-[var(--border)] px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white shadow-lg shadow-sky-600/25">
                  <Activity size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    HealthCare
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Patient Portal
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--subtle)] hover:text-[var(--text)] xl:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex h-[calc(100%-74px)] flex-col justify-between px-4 py-5">
              <div>
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Menu
                </div>
                <nav className="space-y-1" aria-label="Main navigation">
                  {navItems.map(({ label, icon: Icon, badge, route }) => {
                    const isActive = currentPath === route;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleNavigation(route)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                          isActive
                            ? "bg-[var(--primary)] text-white shadow-sm shadow-sky-600/20"
                            : "text-[var(--muted)] hover:bg-[var(--subtle)] hover:text-[var(--text)]"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{label}</span>
                        {typeof badge === "number" && badge > 0 && (
                          <span
                            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                              isActive
                                ? "bg-white text-[var(--primary)]"
                                : "bg-sky-500 text-white"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div>
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Account
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary)]">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--text)]">
                        {patientName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Patient
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Logout"
                      onClick={logout}
                      title="Log out"
                      className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= MAIN CONTENT ================= */}
          <main className="min-w-0">
            {/* HEADER */}
            <header className="panel mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--muted)] transition hover:text-[var(--text)] xl:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>

                <div className="relative w-full min-w-[200px] sm:w-[360px]">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search appointments"
                    placeholder="Search doctor, reason, or status..."
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--subtle)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  title={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => navigate("/notifications")}
                  title="View Notifications"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-[var(--bg)]" />
                  )}
                </button>

                <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-2 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[10px] font-bold text-[var(--primary)]">
                    {initials}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-[var(--text)]">
                      {firstName}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      Patient
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Unable to load dashboard</div>
                  <div className="text-xs text-rose-600 dark:text-rose-300">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="panel p-4">
                      <div className="skeleton h-3 w-20 rounded" />
                      <div className="skeleton mt-5 h-8 w-16 rounded" />
                      <div className="skeleton mt-3 h-3 w-24 rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <div className="panel p-4">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton mt-5 h-24 w-full rounded-2xl" />
                  </div>
                  <div className="panel p-4">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="skeleton h-16 w-full rounded-xl"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* METRICS ROW */}
                <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map(({ label, value, delta, tone, icon: Icon }) => (
                    <div key={label} className="panel p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone].iconWrap}`}
                        >
                          <Icon
                            size={18}
                            className={toneClasses[tone].iconColor}
                          />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          {delta}
                        </span>
                      </div>
                      <div className="mt-4">
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
                  ))}
                </section>

                {/* NEXT APPOINTMENT & RECENT NOTIFICATIONS */}
                <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                  {/* LEFT: NEXT APPOINTMENT & APPOINTMENTS TABLE */}
                  <div className="space-y-4">
                    {/* NEXT APPOINTMENT CARD */}
                    <div className="panel p-4 sm:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Upcoming Visit
                          </div>
                          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text)]">
                            Next Scheduled Appointment
                          </h2>
                        </div>
                        {nextAppointment && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Confirmed
                          </span>
                        )}
                      </div>

                      {nextAppointment ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-base font-bold text-[var(--primary)]">
                                {nextAppointment.doctor
                                  .replace(/^Dr\.?\s*/i, "")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="text-base font-semibold text-[var(--text)]">
                                  Dr. {nextAppointment.doctor.replace(/^Dr\.?\s*/i, "")}
                                </div>
                                <div className="mt-0.5 text-sm text-[var(--muted)]">
                                  {nextAppointment.specialty}
                                </div>
                                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck size={13} />
                                  Confirmed Booking
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-white p-3 text-sm dark:bg-slate-900">
                              <div className="flex items-center gap-2 font-medium text-[var(--text)]">
                                <CalendarDays
                                  size={14}
                                  className="text-[var(--primary)]"
                                />
                                {formatDateLabel(nextAppointment.date)}
                              </div>
                              <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                                <Clock3 size={13} />
                                {nextAppointment.time}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => navigate("/appointments")}
                              className="rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            >
                              Manage Appointment
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate("/doctors")}
                              className="rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--subtle)] dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            >
                              Book Another Visit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--subtle)] p-6 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                            <CalendarDays size={20} />
                          </div>
                          <div className="text-base font-semibold text-[var(--text)]">
                            No upcoming appointments
                          </div>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
                            Schedule a consultation with one of our verified doctors
                            to receive care and AI visit summaries.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate("/doctors")}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                          >
                            <Stethoscope size={14} />
                            Find Doctors & Book
                          </button>
                        </div>
                      )}
                    </div>

                    {/* APPOINTMENTS LIST TABLE */}
                    <div className="panel p-4 sm:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            History
                          </div>
                          <h3 className="mt-0.5 text-base font-semibold text-[var(--text)]">
                            My Recent Appointments
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/appointments")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] transition hover:underline"
                        >
                          View all <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                        <table className="data-table min-w-full">
                          <thead>
                            <tr className="bg-[var(--subtle)]">
                              <th className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Doctor
                              </th>
                              <th className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Date & Time
                              </th>
                              <th className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Status
                              </th>
                              <th className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Mode
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAppointments.length > 0 ? (
                              filteredAppointments.slice(0, 5).map((visit) => (
                                <tr key={visit.id || `${visit.doctor}-${visit.date}`}>
                                  <td className="px-3.5 py-3 text-sm">
                                    <div className="font-medium text-[var(--text)]">
                                      Dr. {visit.doctor.replace(/^Dr\.?\s*/i, "")}
                                    </div>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      {visit.specialty}
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-3 text-sm text-[var(--text)]">
                                    <div>{formatDateLabel(visit.date)}</div>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      {visit.time}
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-3">
                                    <span
                                      className={`status-pill ${
                                        statusClasses[visit.statusKey] ||
                                        "status-default"
                                      }`}
                                    >
                                      {visit.status}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-3 text-xs text-[var(--muted)]">
                                    {visit.location}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-3.5 py-6 text-center text-xs text-[var(--muted)]"
                                >
                                  {search
                                    ? "No appointments match your search criteria."
                                    : "No appointments booked yet."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: NOTIFICATIONS & QUICK ACTIONS */}
                  <div className="space-y-4">
                    {/* NOTIFICATIONS WIDGET */}
                    <div className="panel p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Alerts
                          </div>
                          <h3 className="mt-0.5 text-base font-semibold text-[var(--text)]">
                            Recent Notifications
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/notifications")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] transition hover:underline"
                        >
                          View all <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {recentNotifications.length > 0 ? (
                          recentNotifications.map((item) => (
                            <div
                              key={item.id || `${item.title}-${item.time}`}
                              onClick={() => navigate("/notifications")}
                              className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-3 transition hover:border-[var(--primary)]"
                            >
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  notificationTone[item.tone] ||
                                  notificationTone.info
                                }`}
                              >
                                {item.tone === "warning" ? (
                                  <Clock3 size={14} />
                                ) : item.tone === "success" ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <Bell size={14} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate text-xs font-semibold text-[var(--text)]">
                                    {item.title}
                                  </div>
                                  <span className="shrink-0 text-[10px] text-[var(--muted)]">
                                    {item.time}
                                  </span>
                                </div>
                                <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                                  {item.body}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted)]">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QUICK ACCESS ACTIONS */}
                    <div className="panel p-4 sm:p-5">
                      <div className="mb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          Shortcuts
                        </div>
                        <h3 className="mt-0.5 text-base font-semibold text-[var(--text)]">
                          Quick Actions
                        </h3>
                      </div>

                      <div className="grid gap-2.5">
                        {quickActions.map(
                          ({ title, detail, icon: Icon, accent, route }) => (
                            <button
                              key={title}
                              type="button"
                              onClick={() => handleNavigation(route)}
                              className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-3 text-left transition hover:border-[var(--primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
                                >
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[var(--text)]">
                                    {title}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)]">
                                    {detail}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight
                                size={14}
                                className="text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
                              />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const toneClasses = {
  blue: {
    iconWrap: "bg-sky-50 dark:bg-sky-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    text: "text-sky-700 dark:text-sky-300",
  },
  amber: {
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-300",
  },
  emerald: {
    iconWrap: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  rose: {
    iconWrap: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    text: "text-rose-700 dark:text-rose-300",
  },
};

const quickActions = [
  {
    title: "Find Doctors & Book",
    detail: "Browse doctors and reserve time slots",
    icon: UsersRound,
    accent: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    route: "/doctors",
  },
  {
    title: "My Appointments",
    detail: "View, reschedule, or cancel bookings",
    icon: CalendarDays,
    accent:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    route: "/appointments",
  },
  {
    title: "My Medical Profile",
    detail: "View account details and Google Calendar sync",
    icon: FileText,
    accent:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    route: "/profile",
  },
];

const notificationTone = {
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

export default PatientDashboard;

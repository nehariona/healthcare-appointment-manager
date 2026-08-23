import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Sun,
  TrendingUp,
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

const navItems = [
  { label: "Overview", icon: LayoutGrid, route: "/dashboard" },
  { label: "Appointments", icon: CalendarDays, route: "/appointments" },
  { label: "Doctors", icon: Stethoscope, route: "/doctors" },
  { label: "Records", icon: FileText, route: "/profile" },
  { label: "Notifications", icon: Bell, badge: 3, route: "/notifications" },
  { label: "Settings", icon: Settings, route: "/profile" },
];

const statusClasses = {
  confirmed: "status-confirmed",
  scheduled: "status-confirmed",
  pending: "status-pending",
  review: "status-warning",
  completed: "status-success",
  cancelled: "status-default",
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

  if (["confirmed", "scheduled"].includes(value)) return "Confirmed";
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

        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        setNotificationItems(Array.isArray(notificationsData) ? notificationsData : []);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load your care dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const patientName = user?.full_name || user?.name || "Patient Doe";
  const firstName = patientName.split(" ")[0];
  const initials = patientName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const appointmentRows = useMemo(() => {
    return appointments
      .map((item) => {
        const dateValue = item.appointment_time || item.appointment_time_ist || item.date;
        const dateObj = new Date(dateValue);
        const normalizedStatus = normalizeStatus(item.status);

        return {
          id: item.appointment_id,
          doctor: item.doctor_name || "Doctor",
          specialty: item.reason || "Consultation",
          time: formatTimeLabel(dateValue),
          date: dateValue,
          rawDate: dateObj,
          status: normalizedStatus,
          statusKey: (item.status || "scheduled").toLowerCase(),
          location: item.google_calendar_event_id ? "Virtual / configured" : "Clinic",
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
    const alerts = notificationItems.filter(
      (item) => item.status === "pending" || item.status === "failed"
    ).length;

    return [
      {
        label: "Total visits",
        value: String(total),
        delta: total > 0 ? `${completed} completed` : "No visits yet",
        tone: "blue",
        icon: CalendarDays,
      },
      {
        label: "Upcoming",
        value: String(upcoming),
        delta: upcoming === 1 ? "1 visit scheduled" : `${upcoming} visits scheduled`,
        tone: "amber",
        icon: Clock3,
      },
      {
        label: "Completed",
        value: String(completed),
        delta: total > 0 ? `${Math.round((completed / total) * 100)}% adherence` : "0% adherence",
        tone: "emerald",
        icon: CheckCircle2,
      },
      {
        label: "Alerts",
        value: String(alerts || notificationItems.length),
        delta: alerts > 0 ? `${alerts} needing review` : "No new alerts",
        tone: "rose",
        icon: Bell,
      },
    ];
  }, [appointmentRows, notificationItems]);

  const nextAppointment = useMemo(() => {
    if (!appointmentRows.length) return null;

    return [
      ...appointmentRows.filter(
        (item) => new Date(item.date) >= Date.now()
      ),
    ].sort((a, b) => new Date(a.date) - new Date(b.date))[0] || appointmentRows[0];
  }, [appointmentRows]);

  const recentNotifications = useMemo(() => {
    return notificationItems.slice(0, 3).map((item) => {
      const type = (item.notification_type || "info").toLowerCase();
      let tone = "info";

      if (type.includes("appointment") || type.includes("reminder")) tone = "warning";
      if (type.includes("summary") || type.includes("follow") || type.includes("care")) tone = "success";

      return {
        title: item.subject || item.notification_type || "Account update",
        body: item.body || "No details provided.",
        time: formatRelativeTime(item.created_at),
        tone,
      };
    });
  }, [notificationItems]);

  const adherenceValue = appointmentRows.length
    ? Math.min(100, Math.round((stats[2].value / Math.max(appointmentRows.length, 1)) * 100))
    : 0;

  const nextFollowUp = nextAppointment
    ? `${formatDateLabel(nextAppointment.date)} • ${nextAppointment.time}`
    : "No upcoming appointments";

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
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="mx-auto max-w-[1600px] p-3 sm:p-4 xl:p-5">
        <div className="grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside
            className={`panel fixed left-3 top-3 z-50 h-[calc(100vh-1.5rem)] w-[260px] p-0 transition-transform duration-200 xl:sticky xl:left-auto xl:top-auto xl:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-[120%] xl:translate-x-0"
            }`}
          >
            <div className="flex h-[74px] items-center justify-between border-b border-[var(--border)] px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white shadow-lg shadow-blue-600/25">
                  <ActivityIcon />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">HealthCare</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Appointment Suite
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

            <div className="space-y-7 px-4 py-5">
              <div>
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Workspace
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
                          ? "bg-[var(--primary)] text-white shadow-sm shadow-blue-600/20"
                          : "text-[var(--muted)] hover:bg-[var(--subtle)] hover:text-[var(--text)]"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                            isActive ? "bg-white text-[var(--primary)]" : "bg-rose-500 text-white"
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
                  Care team
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary)]">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--text)]">{patientName}</div>
                      <div className="text-[11px] text-[var(--muted)]">Patient member</div>
                    </div>
                    <button
                      type="button"
                      aria-label="Logout"
                      onClick={logout}
                      className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-white hover:text-rose-600"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 xl:pl-0">
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
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search appointments"
                    placeholder="Search visits, doctors, statuses..."
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--subtle)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  <Bell size={16} />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[var(--bg)]" />
                </button>
                <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-2 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[10px] font-bold text-[var(--primary)]">
                    {initials}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-[var(--text)]">{firstName}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">Patient</div>
                  </div>
                </div>
              </div>
            </header>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Unable to load care overview</div>
                  <div className="text-xs text-rose-600 dark:text-rose-300">{error}</div>
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
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="skeleton h-12 w-full rounded-xl" />
                      ))}
                    </div>
                  </div>
                  <div className="panel p-4">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="skeleton h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map(({ label, value, delta, tone, icon: Icon }) => (
                    <div key={label} className="panel p-4">
                      <div className="flex items-start justify-between">
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone].iconWrap}`}>
                          <Icon size={18} className={toneClasses[tone].iconColor} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          {delta}
                        </span>
                      </div>
                      <div className="mt-5">
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                          {label}
                        </div>
                        <div className={`mt-1 text-[28px] font-semibold tracking-tight ${toneClasses[tone].text}`}>
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
                  <div className="panel p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          Next appointment
                        </div>
                        <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">
                          Care coordination
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Scheduled
                      </span>
                    </div>

                    {nextAppointment ? (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">
                              {nextAppointment.doctor.split(" ").slice(1).join(" ").slice(0, 2) || "DS"}
                            </div>
                            <div>
                              <div className="text-base font-semibold text-[var(--text)]">{nextAppointment.doctor}</div>
                              <div className="mt-1 text-sm text-[var(--muted)]">{nextAppointment.specialty}</div>
                              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
                                <ShieldCheck size={12} />
                                Verified specialist
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-[var(--border)] bg-white/70 p-3 text-sm dark:bg-slate-900/60">
                            <div className="flex items-center gap-2 font-medium text-[var(--text)]">
                              <CalendarDays size={14} className="text-[var(--primary)]" />
                              {new Date(nextAppointment.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                              <Clock3 size={13} />
                              {nextAppointment.time}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                            View notes
                          </button>
                          <button type="button" className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                            Manage visit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--subtle)] p-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                          <CalendarDays size={18} />
                        </div>
                        <div className="text-base font-semibold text-[var(--text)]">No upcoming visits</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">Book a consultation to keep your care plan moving.</div>
                      </div>
                    )}

                    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)]">
                      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--subtle)] px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          Schedule
                        </div>
                        <button type="button" className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                          Filter <ChevronDown size={12} />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="data-table min-w-full">
                          <thead>
                            <tr>
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Doctor</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Date</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAppointments.length > 0 ? (
                              filteredAppointments.map((visit) => (
                                <tr key={`${visit.doctor}-${visit.date}`}>
                                  <td className="px-3 py-2.5 text-sm">
                                    <div className="font-medium text-[var(--text)]">{visit.doctor}</div>
                                    <div className="text-[11px] text-[var(--muted)]">{visit.specialty}</div>
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-[var(--text)]">
                                    {new Date(visit.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className={`status-pill ${statusClasses[visit.status] || "status-default"}`}>
                                      {visit.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-[var(--muted)]">{visit.location}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                                  No appointments match your search.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="panel p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Performance
                          </div>
                          <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Care trend</h3>
                        </div>
                        <TrendingUp size={16} className="text-[var(--primary)]" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
                            <span>Follow-up adherence</span>
                            <span className="font-semibold text-[var(--text)]">76%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--subtle)]">
                            <div className="h-full w-[76%] rounded-full bg-[var(--primary)]" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
                            <span>Response time</span>
                            <span className="font-semibold text-[var(--text)]">1.8d</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--subtle)]">
                            <div className="h-full w-[65%] rounded-full bg-emerald-500" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
                            <span>On-time rate</span>
                            <span className="font-semibold text-[var(--text)]">92%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--subtle)]">
                            <div className="h-full w-[92%] rounded-full bg-amber-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="panel p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Signals
                          </div>
                          <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Recent updates</h3>
                        </div>
                        <button type="button" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                          View all
                        </button>
                      </div>

                      <div className="space-y-3">
                        {recentNotifications.map((item) => (
                          <div key={`${item.title}-${item.time}`} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notificationTone[item.tone]}`}>
                              {item.tone === "warning" ? <Clock3 size={14} /> : item.tone === "success" ? <CheckCircle2 size={14} /> : <Bell size={14} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[12px] font-semibold text-[var(--text)]">{item.title}</div>
                                <span className="text-[9px] text-[var(--muted)]">{item.time}</span>
                              </div>
                              <div className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{item.body}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="panel p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          Quick access
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Care management</h3>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {quickActions.map(({ title, detail, icon: Icon, accent }) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => handleNavigation(title === "Find a doctor" ? "/doctors" : title === "My records" ? "/profile" : "/notifications")}
                          className="group rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                          <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                            <Icon size={17} />
                          </div>
                          <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
                          <div className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{detail}</div>
                          <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                            Open <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="panel p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          Intake check
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Care request</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="patient-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Contact email
                        </label>
                        <input
                          id="patient-email"
                          value="alex.patel@carehealth.io"
                          className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        />
                        <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-300">Verified and up to date</div>
                      </div>

                      <div>
                        <label htmlFor="preference" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Preferred follow-up
                        </label>
                        <input
                          id="preference"
                          value="Friday after 4:00 PM"
                          aria-invalid="true"
                          className="h-10 w-full rounded-xl border border-rose-300 bg-rose-50 px-3 text-sm text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                        />
                        <div className="mt-1.5 text-[10px] text-rose-600 dark:text-rose-300">Unavailable window — please choose a different slot.</div>
                      </div>

                      <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                        <Download size={15} />
                        Save care preferences
                      </button>
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

const quickActions = [
  {
    title: "Find a doctor",
    detail: "Browse specialists and care teams.",
    icon: UsersRound,
    accent: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  },
  {
    title: "My records",
    detail: "Review notes, labs, and visits.",
    icon: FileText,
    accent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    title: "Account settings",
    detail: "Update profile and communication",
    icon: Settings,
    accent: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  },
];

const notificationTone = {
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
};

function ActivityIcon() {
  return <Activity size={18} strokeWidth={2.5} />;
}

export default PatientDashboard;

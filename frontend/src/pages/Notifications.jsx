import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  X,
  ArrowRight,
} from "lucide-react";


import { getNotifications } from "../api/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState(null);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(data || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  function formatDate(value) {
    if (!value) return "";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getNotificationIcon(notification) {
    const type =
      notification?.notification_type?.toLowerCase() || "";

    if (type.includes("appointment")) {
      return CalendarCheck2;
    }

    if (type.includes("reminder")) {
      return Clock3;
    }

    return Bell;
  }

  function getNotificationType(notification) {
    const type =
      notification?.notification_type?.toLowerCase() || "";

    if (type.includes("appointment")) {
      return "Appointment";
    }

    if (type.includes("reminder")) {
      return "Reminder";
    }

    if (type.includes("cancel")) {
      return "Cancellation";
    }

    if (type.includes("reschedule")) {
      return "Reschedule";
    }

    return "Notification";
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ================= HEADER ================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Bell size={18} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                Activity Center
              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Stay updated with your appointments
              and account activity.
            </p>

          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              Refresh
            </button>

            

          </div>

        </div>


        {/* ================= SUMMARY ================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total notifications
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {loading ? "—" : notifications.length}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Bell size={20} />
              </div>

            </div>

          </div>


          {/* STATUS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notification status
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <CheckCircle2
                    size={18}
                    className="text-emerald-500"
                  />

                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    You're up to date
                  </p>

                </div>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={20} />
              </div>

            </div>

          </div>

        </div>


        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/10">

            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              Unable to load notifications
            </p>

            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
              {error}
            </p>

          </div>
        )}


        {/* ================= SECTION HEADER ================= */}

        {!loading && notifications.length > 0 && (
          <div className="mb-4">

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent activity
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your latest account and appointment updates.
            </p>

          </div>
        )}


        {/* ================= LOADING ================= */}

        {loading && (
          <div className="space-y-4">

            {[1, 2, 3].map((item) => (
              <NotificationSkeleton key={item} />
            ))}

          </div>
        )}


        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          notifications.length === 0 && (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                <Bell size={28} />

              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                You're all caught up
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                You don't have any notifications right now.
                New appointment and account updates will
                appear here.
              </p>

            </div>
          )}


        {/* ================= NOTIFICATIONS ================= */}

        {!loading &&
          notifications.length > 0 && (

            <div className="space-y-4">

              {notifications.map(
                (notification, index) => {

                  const Icon =
                    getNotificationIcon(notification);

                  const type =
                    getNotificationType(notification);

                  const title =
                    notification.subject ||
                    notification.title ||
                    notification.notification_type ||
                    "Notification";

                  const message =
                    notification.body ||
                    notification.message ||
                    "No additional details available.";

                  return (
                    <article
                      key={
                        notification.id ||
                        index
                      }
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30 sm:p-6"
                    >

                      <div className="flex gap-4">

                        {/* ICON */}

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                          <Icon size={20} />

                        </div>


                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div>

                              <div className="mb-1 flex flex-wrap items-center gap-2">

                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                  {type}
                                </span>

                              </div>

                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {title}
                              </h3>

                            </div>

                            {notification.created_at && (
                              <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400">

                                <Clock3 size={13} />

                                {formatDate(
                                  notification.created_at
                                )}

                              </div>
                            )}

                          </div>


                          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {message}
                          </p>


                          <button
                            type="button"
                            onClick={() =>
                              setSelectedNotification(
                                notification
                              )
                            }
                            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View details
                            <ArrowRight
                              size={14}
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </div>


      {/* ================= DETAIL MODAL ================= */}

      {selectedNotification && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedNotification(null)
          }
        >

          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

                  <Bell size={20} />

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {getNotificationType(
                      selectedNotification
                    )}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    Notification details
                  </h2>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="p-6">

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedNotification.subject ||
                  selectedNotification.title ||
                  selectedNotification.notification_type ||
                  "Notification"}
              </h3>

              {selectedNotification.created_at && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">

                  <Clock3 size={13} />

                  {formatDate(
                    selectedNotification.created_at
                  )}

                </p>
              )}

              <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selectedNotification.body ||
                    selectedNotification.message ||
                    "No additional details available."}
                </p>

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-slate-100 px-6 py-4 dark:border-slate-800">

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(null)
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


/* ============================================
   NOTIFICATION SKELETON
============================================ */

function NotificationSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex gap-4">

        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

        <div className="flex-1">

          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-3 h-5 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-5 h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

        </div>

      </div>

    </div>
  );
}

export default Notifications;
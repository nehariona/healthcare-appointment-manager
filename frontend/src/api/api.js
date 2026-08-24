import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// JWT
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// AUTH ERROR HANDLING
// =========================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

// =========================================================
// AUTH
// =========================================================

export async function register(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function login(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

// =========================================================
// USERS
// =========================================================

export async function getMyProfile() {
  const response = await api.get("/users/me");
  return response.data;
}

// =========================================================
// DOCTORS
// =========================================================

export async function getDoctors() {
  const response = await api.get("/doctors/");
  return response.data;
}

export async function getMyDoctorProfile() {
  const response = await api.get("/doctors/me");
  return response.data;
}

export async function createDoctorProfile(data) {
  const response = await api.post("/doctors/profile", data);
  return response.data;
}

// =========================================================
// APPOINTMENTS
// =========================================================

export async function bookAppointment(data) {
  const response = await api.post("/appointments/", data);
  return response.data;
}

export async function getAvailableSlots(doctorId, date) {
  const response = await api.get(
    `/appointments/doctor/${doctorId}/slots`,
    {
      params: {
        appointment_date: date,
      },
    }
  );

  return response.data;
}

export async function getMyAppointments() {
  const response = await api.get("/appointments/my");
  return response.data;
}

export async function cancelAppointment(appointmentId) {
  const response = await api.delete(
    `/appointments/${appointmentId}`
  );

  return response.data;
}

export async function rescheduleAppointment(
  appointmentId,
  data
) {
  const payload =
    typeof data === "object" && data !== null
      ? data
      : {
          new_time: data,
        };

  const response = await api.put(
    `/appointments/${appointmentId}/reschedule`,
    payload
  );

  return response.data;
}

// =========================================================
// SYMPTOMS / PRE-VISIT SUMMARY
// =========================================================

export async function createSymptoms(data) {
  const response = await api.post("/symptoms/", data);
  return response.data;
}

export async function getAppointmentSymptoms(
  appointmentId
) {
  const response = await api.get(
    `/symptoms/appointment/${appointmentId}`
  );

  return response.data;
}

// =========================================================
// VISITS / AI SUMMARY
// =========================================================

export async function createVisit(data) {
  const response = await api.post("/visits/", data);
  return response.data;
}

export async function getVisit(appointmentId) {
  const response = await api.get(
    `/visits/${appointmentId}`
  );

  return response.data;
}

// =========================================================
// NOTIFICATIONS
// =========================================================

export async function getNotifications() {
  const response = await api.get("/notifications/");
  return response.data;
}

export async function getNotification(id) {
  const response = await api.get(
    `/notifications/${id}`
  );

  return response.data;
}

export async function getPendingNotifications() {
  const response = await api.get(
    "/notifications/status/pending"
  );

  return response.data;
}

export async function getFailedNotifications() {
  const response = await api.get(
    "/notifications/status/failed"
  );

  return response.data;
}

// =========================================================
// ADMIN
// =========================================================

export async function getPendingDoctors() {
  const response = await api.get(
    "/admin/doctors/pending"
  );

  return response.data;
}

export async function approveDoctor(verificationId) {
  const response = await api.post(
    `/admin/doctors/${verificationId}/approve`
  );

  return response.data;
}

export async function markDoctorLeave(
  doctorId,
  leaveDate,
  reason
) {
  const response = await api.post(
    `/admin/doctors/${doctorId}/leave`,
    null,
    {
      params: {
        leave_date: leaveDate,
        reason,
      },
    }
  );

  return response.data;
}

// =========================================================
// GOOGLE CALENDAR
// =========================================================

export async function getGoogleCalendarAuthUrl() {
  const response = await api.get("/calendar/oauth/authorize");
  return response.data;
}

export default api;
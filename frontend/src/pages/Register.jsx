import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  CheckCircle2,
  Stethoscope,
  Building2,
  BriefcaseBusiness,
  CreditCard,
  BadgeCheck,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerAPI } from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",

    // Doctor details
    specialization: "",
    hospital: "",
    experience_years: "",
    government_id_number: "",
    medical_license_number: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // =========================================================
  // ERROR HANDLING
  // =========================================================

  function getFriendlyError(err) {
    const detail = err?.response?.data?.detail;

    // FastAPI validation errors
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item?.msg)
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (typeof detail === "string") {
      const lower = detail.toLowerCase();

      if (
        lower.includes("already") &&
        lower.includes("email")
      ) {
        return "An account with this email already exists.";
      }

      if (lower.includes("email")) {
        return detail;
      }

      if (lower.includes("specialization")) {
        return "Specialization is required for doctors.";
      }

      if (lower.includes("hospital")) {
        return "Hospital is required for doctors.";
      }

      if (lower.includes("experience")) {
        return "Experience years is required for doctors.";
      }

      if (lower.includes("government id")) {
        return "Government ID is required for doctors.";
      }

      if (lower.includes("medical license")) {
        return "Medical license number is required for doctors.";
      }

      return detail;
    }

    if (err?.message) {
      return err.message;
    }

    return "Registration failed. Please try again.";
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const fullName = form.full_name.trim();
    const email = form.email.trim();

    // -------------------------------------------------------
    // Basic validation
    // -------------------------------------------------------

    if (
      !fullName ||
      !email ||
      !form.password ||
      !form.confirmPassword ||
      !form.role
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // -------------------------------------------------------
    // Doctor validation
    // -------------------------------------------------------

    if (form.role === "doctor") {
      if (!form.specialization.trim()) {
        setError("Please enter your specialization.");
        return;
      }

      if (!form.hospital.trim()) {
        setError("Please enter your hospital or clinic.");
        return;
      }

      if (
        form.experience_years === "" ||
        Number(form.experience_years) < 0
      ) {
        setError("Please enter valid years of experience.");
        return;
      }

      if (!form.government_id_number.trim()) {
        setError("Please enter your government ID number.");
        return;
      }

      if (!form.medical_license_number.trim()) {
        setError("Please enter your medical license number.");
        return;
      }
    }

    try {
      setLoading(true);

      // -----------------------------------------------------
      // Base registration payload
      // -----------------------------------------------------

      const payload = {
        full_name: fullName,
        email,
        password: form.password,
        role: form.role,
      };

      // -----------------------------------------------------
      // Add doctor-specific fields
      // -----------------------------------------------------

      if (form.role === "doctor") {
        payload.specialization =
          form.specialization.trim();

        payload.hospital =
          form.hospital.trim();

        payload.experience_years =
          Number(form.experience_years);

        payload.government_id_number =
          form.government_id_number.trim();

        payload.medical_license_number =
          form.medical_license_number.trim();
      }

      console.log("Registration payload:", {
        ...payload,
        password: "********",
      });

      await registerAPI(payload);

      // Registration successful
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);

      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/20 blur-3xl" />
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-2">

        {/* ===================================================
            LEFT BRAND PANEL
        ==================================================== */}

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">

          <div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div
            className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10">

            {/* Logo */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                <HeartPulse size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  HealthCare
                </h2>

                <p className="text-xs text-blue-200">
                  Appointment Manager
                </p>
              </div>

            </div>

            {/* Main content */}

            <div className="mt-24 max-w-lg">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                <CheckCircle2 size={14} />
                Secure healthcare management
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Your healthcare,
                <br />

                <span className="text-blue-300">
                  organized.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-blue-100/80 xl:text-base">
                Create your account and manage
                appointments, doctors, notifications,
                and your healthcare journey from one
                secure platform.
              </p>

              {/* Features */}

              <div className="mt-10 space-y-5">

                {[
                  "Easy appointment scheduling",
                  "Secure patient and doctor management",
                  "Real-time appointment updates",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-blue-50"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-300"
                      />
                    </div>

                    <span>{feature}</span>
                  </div>
                ))}

              </div>

            </div>

          </div>

          {/* Security footer */}

          <div className="relative z-10 flex items-center gap-2 text-xs text-blue-300/70">
            <ShieldCheck size={15} />

            <span>
              Secure healthcare platform
            </span>
          </div>

        </section>

        {/* ===================================================
            RIGHT REGISTER PANEL
        ==================================================== */}

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">

          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================== */}

            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <HeartPulse size={24} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  HealthCare
                </h2>

                <p className="text-xs text-slate-500">
                  Appointment Manager
                </p>
              </div>

            </div>

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="text-center">

              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                Get Started
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Join HealthCare Appointment Manager
                and take control of your healthcare.
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* =================================================
                  FULL NAME
              ================================================== */}

              <div>

                <label
                  htmlFor="full_name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* =================================================
                  EMAIL
              ================================================== */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* =================================================
                  ACCOUNT TYPE
              ================================================== */}

              <div>

                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Account type
                </label>

                <div className="relative">

                  <Stethoscope
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="patient">
                      Patient
                    </option>

                    <option value="doctor">
                      Doctor
                    </option>
                  </select>

                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                </div>

              </div>

              {/* =================================================
                  DOCTOR DETAILS
              ================================================== */}

              {form.role === "doctor" && (
                <div className="space-y-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <BadgeCheck size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Doctor verification
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Please provide the following
                        information for verification.
                      </p>
                    </div>

                  </div>

                  {/* Specialization */}

                  <div>

                    <label
                      htmlFor="specialization"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Specialization
                    </label>

                    <div className="relative">

                      <Stethoscope
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="specialization"
                        name="specialization"
                        type="text"
                        value={form.specialization}
                        onChange={handleChange}
                        placeholder="e.g. Cardiology"
                        disabled={loading}
                        required={form.role === "doctor"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* Hospital */}

                  <div>

                    <label
                      htmlFor="hospital"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Hospital / Clinic
                    </label>

                    <div className="relative">

                      <Building2
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="hospital"
                        name="hospital"
                        type="text"
                        value={form.hospital}
                        onChange={handleChange}
                        placeholder="Enter hospital or clinic"
                        disabled={loading}
                        required={form.role === "doctor"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* Experience */}

                  <div>

                    <label
                      htmlFor="experience_years"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Years of experience
                    </label>

                    <div className="relative">

                      <BriefcaseBusiness
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="experience_years"
                        name="experience_years"
                        type="number"
                        min="0"
                        value={form.experience_years}
                        onChange={handleChange}
                        placeholder="e.g. 5"
                        disabled={loading}
                        required={form.role === "doctor"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* Government ID */}

                  <div>

                    <label
                      htmlFor="government_id_number"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Government ID number
                    </label>

                    <div className="relative">

                      <CreditCard
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="government_id_number"
                        name="government_id_number"
                        type="text"
                        value={form.government_id_number}
                        onChange={handleChange}
                        placeholder="Enter government ID"
                        disabled={loading}
                        required={form.role === "doctor"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* Medical License */}

                  <div>

                    <label
                      htmlFor="medical_license_number"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Medical license number
                    </label>

                    <div className="relative">

                      <BadgeCheck
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="medical_license_number"
                        name="medical_license_number"
                        type="text"
                        value={form.medical_license_number}
                        onChange={handleChange}
                        placeholder="Enter medical license number"
                        disabled={loading}
                        required={form.role === "doctor"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  PASSWORD
              ================================================== */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    minLength={6}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Use at least 6 characters.
                </p>

              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================== */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className={`h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-2 ${
                      form.confirmPassword &&
                      form.password !==
                        form.confirmPassword
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                {form.confirmPassword &&
                  form.password ===
                    form.confirmPassword && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} />
                      Passwords match
                    </div>
                  )}

              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />

                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                LOGIN
            ================================================== */}

            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?{" "}

                <Link
                  to="/login"
                  className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                >
                  Sign in
                </Link>
              </p>

            </div>

            {/* =================================================
                SECURITY
            ================================================== */}

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600">

              <ShieldCheck size={15} />

              <span>
                Your information is securely protected
              </span>

            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © 2026 HealthCare Appointment Manager
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
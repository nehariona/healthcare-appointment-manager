
import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // Login through AuthContext
      const user = await login(
        form.email,
        form.password
      );

      console.log("Logged-in user:", user);

      /*
       * Navigate according to the user's role.
       *
       * Your backend may return:
       * "patient"
       * "doctor"
       * "admin"
       */

      const role = user?.role?.toLowerCase();

      if (role === "patient") {
        navigate("/dashboard", { replace: true });
      } else if (role === "doctor") {
        navigate("/doctor", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        // If backend doesn't return role,
        // temporarily send user to patient dashboard.
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);

      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;

      setError(
        backendMessage ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* ================= LEFT ================= */}

        <section className="hidden lg:flex relative bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white p-12 xl:p-16 flex-col justify-between">

          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <HeartPulse size={24} />
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  HealthCare
                </h2>

                <p className="text-xs text-blue-200">
                  Appointment Manager
                </p>
              </div>

            </div>

            {/* Content */}
            <div className="mt-24 max-w-lg">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium">
                <CheckCircle2 size={14} />

                Secure healthcare management
              </div>

              <h1 className="mt-6 text-4xl xl:text-5xl font-bold leading-tight">

                Manage your healthcare,

                <br />

                <span className="text-blue-300">
                  with confidence.
                </span>

              </h1>

              <p className="mt-6 text-blue-100/80 leading-7">
                Book appointments, manage your schedule,
                stay updated with notifications, and keep
                your healthcare journey organized in one
                secure platform.
              </p>

              <div className="mt-10 space-y-5">

                {[
                  "Easy appointment scheduling",
                  "Secure patient and doctor management",
                  "Real-time appointment updates",
                ].map((feature) => (

                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm"
                  >

                    <div className="w-6 h-6 rounded-full bg-emerald-400/15 flex items-center justify-center">

                      <CheckCircle2
                        size={16}
                        className="text-emerald-300"
                      />

                    </div>

                    {feature}

                  </div>

                ))}

              </div>

            </div>

          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-blue-300/70">

            <ShieldCheck size={15} />

            Secure healthcare platform

          </div>

        </section>

        {/* ================= RIGHT ================= */}

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">

          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-10">

              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
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

            {/* Header */}
            <div className="text-center">

              <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                Welcome Back
              </div>

              <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your credentials to continue to
                your healthcare dashboard.
              </p>

            </div>

            {/* Error */}
            {error && (

              <div
                role="alert"
                className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>

            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-semibold text-slate-700"
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
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />

                </div>

              </div>

              {/* Password */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                   import { Link } from "react-router-dom";
                   <Link
  to="/forgot-password"
  className="text-blue-600 hover:underline"
>
  Forgot password?
</Link>
                  </button>

                </div>

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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 text-sm text-slate-600">

                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                Remember me

              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* Register */}
            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">

                New to HealthCare?{" "}

                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Create an account
                </Link>

              </p>

            </div>

            {/* Security */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600">

              <ShieldCheck size={15} />

              Secure healthcare platform

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

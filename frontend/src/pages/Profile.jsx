import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  Stethoscope,
  Building2,
  BriefcaseMedical,
  Clock3,
  CheckCircle2,
  LogOut,
} from "lucide-react";

import LogoutButton from "../components/LogoutButton";
import { getMyDoctorProfile } from "../api/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    async function loadDoctorProfile() {
      if (user?.role !== "doctor") {
        setDoctorProfile(null);
        return;
      }

      try {
        const data = await getMyDoctorProfile();
        setDoctorProfile(data || null);
      } catch (error) {
        console.error(
          "Unable to fetch doctor profile:",
          error
        );
        setDoctorProfile(null);
      }
    }

    loadDoctorProfile();
  }, [user?.role]);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const roleLabel =
    user?.role === "patient"
      ? "Patient"
      : user?.role === "doctor"
        ? "Doctor"
        : user?.role === "admin"
          ? "Administrator"
          : user?.role || "User";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <UserRound size={18} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                Account
              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage and view your account information.
            </p>
          </div>

          <LogoutButton compact={false} />

        </div>


        {/* PROFILE HERO */}

        <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Decorative background */}

          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

          <div className="relative px-6 pb-7 pt-16 sm:px-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">

              {/* Avatar */}

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-lg dark:border-slate-900 dark:bg-blue-500/20 dark:text-blue-300">
                {initials}
              </div>

              {/* Identity */}

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user?.full_name || "User"}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>

                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">

                  <span className="flex items-center gap-1.5">
                    <Mail size={15} />
                    {user?.email || "No email available"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <UserRound size={15} />
                    {roleLabel}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* PERSONAL INFORMATION */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">

            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <UserRound size={19} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Your basic account details
                  </p>
                </div>

              </div>

            </div>

            <div className="grid gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-2">

              <ProfileField
                label="Full Name"
                value={user?.full_name}
              />

              <ProfileField
                label="Email Address"
                value={user?.email}
              />

              <ProfileField
                label="Account Role"
                value={roleLabel}
              />

              <ProfileField
                label="Account Status"
                value="Active"
                active
              />

            </div>

          </section>


          {/* SECURITY CARD */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Security
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Account protection
                  </p>
                </div>

              </div>

            </div>

            <div className="px-6 py-6">

              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">

                <div className="flex gap-3">

                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />

                  <div>

                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Account protected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                      Your account is securely authenticated
                      through the appointment management system.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* DOCTOR INFORMATION */}

          {user?.role === "doctor" && (

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">

              <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <Stethoscope size={19} />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Professional Information
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Your medical practice details
                    </p>

                  </div>

                </div>

              </div>


              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

                <DoctorField
                  icon={BriefcaseMedical}
                  label="Specialization"
                  value={
                    doctorProfile?.specialization ||
                    "Not provided"
                  }
                />

                <DoctorField
                  icon={Building2}
                  label="Hospital"
                  value={
                    doctorProfile?.hospital ||
                    "Not provided"
                  }
                />

                <DoctorField
                  icon={Stethoscope}
                  label="Experience"
                  value={`${doctorProfile?.experience_years ?? 0} years`}
                />

                <DoctorField
                  icon={Clock3}
                  label="Practice Hours"
                  value={`${doctorProfile?.working_start || "09:00"} - ${
                    doctorProfile?.working_end || "17:00"
                  }`}
                />

              </div>

            </section>

          )}

        </div>

      </div>

    </div>
  );
}


/* -----------------------------
   SMALL REUSABLE COMPONENTS
------------------------------ */

function ProfileField({
  label,
  value,
  active = false,
}) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-semibold ${
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value || "Not available"}
      </p>

    </div>
  );
}


function DoctorField({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
        <Icon size={17} />
      </div>

      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
        {value}
      </p>

    </div>
  );
}

export default Profile;
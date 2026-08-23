import { useEffect, useState } from "react";
import {
  Search,
  X,
  RefreshCw,
  Stethoscope,
  UsersRound,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

import { getDoctors } from "../../api/api";
import DoctorCard from "../../components/DoctorCard";
import BookAppointment from "./BookAppointment";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  async function loadDoctors() {
    try {
      setLoading(true);
      setError("");

      const data = await getDoctors();

      // IMPORTANT: See exactly what backend returns
      console.log("=================================");
      console.log("DOCTORS API RESPONSE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("IS ARRAY:", Array.isArray(data));
      console.log("=================================");

      /*
       * Handle common FastAPI response formats.
       *
       * Format 1:
       * [
       *   {...},
       *   {...}
       * ]
       *
       * Format 2:
       * {
       *   doctors: [...]
       * }
       *
       * Format 3:
       * {
       *   data: [...]
       * }
       */

      let doctorList = [];

      if (Array.isArray(data)) {
        doctorList = data;
      } else if (Array.isArray(data?.doctors)) {
        doctorList = data.doctors;
      } else if (Array.isArray(data?.data)) {
        doctorList = data.data;
      }

      console.log("FINAL DOCTOR LIST:", doctorList);

      setDoctors(doctorList);

    } catch (err) {
      console.error("GET DOCTORS ERROR:", err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load doctors."
      );

      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  if (selectedDoctor) {
    return (
      <BookAppointment
        doctor={selectedDoctor}
        onBack={() => setSelectedDoctor(null)}
        onBooked={() => setSelectedDoctor(null)}
      />
    );
  }

  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    const name = String(
      doctor?.full_name ||
      doctor?.name ||
      doctor?.doctor_name ||
      ""
    ).toLowerCase();

    const specialization = String(
      doctor?.specialization ||
      doctor?.specialty ||
      ""
    ).toLowerCase();

    return (
      name.includes(searchText) ||
      specialization.includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Stethoscope size={18} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                Care Directory
              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Find a Doctor
            </h1>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Find the right healthcare professional
              and book your appointment.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDoctors}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

        </div>


        {/* SEARCH */}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-4 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              )}

            </div>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950">

              <SlidersHorizontal
                size={17}
                className="text-slate-400"
              />

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Showing
                </p>

                <p className="text-sm font-bold">
                  {loading
                    ? "..."
                    : `${filteredDoctors.length} doctors`}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">

            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              Unable to load doctors
            </p>

            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadDoctors}
              className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700"
            >
              Try again
            </button>

          </div>
        )}


        {/* RESULT HEADER */}

        <div className="mb-5 flex items-end justify-between">

          <div>

            <h2 className="text-lg font-bold">
              Available Doctors
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {loading
                ? "Loading doctors..."
                : `${filteredDoctors.length} doctors available`}
            </p>

          </div>

          {!loading && doctors.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <UsersRound size={15} />
              {filteredDoctors.length} of {doctors.length}
            </div>
          )}

        </div>


        {/* LOADING */}

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <DoctorSkeleton key={item} />
            ))}

          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredDoctors.length === 0 && (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Search size={27} />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                No doctors found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                No doctors were returned by the
                backend for this account.
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Clear search
                  <ArrowRight size={15} />
                </button>
              )}

            </div>
          )}


        {/* DOCTORS */}

        {!loading &&
          !error &&
          filteredDoctors.length > 0 && (

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {filteredDoctors.map((doctor, index) => (

                <DoctorCard
                  key={
                    doctor.doctor_id ??
                    doctor.id ??
                    doctor.user_id ??
                    index
                  }
                  doctor={doctor}
                  onBook={setSelectedDoctor}
                />

              ))}

            </div>
          )}

      </div>
    </div>
  );
}


/* SKELETON */

function DoctorSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-4">

        <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

        <div className="flex-1">

          <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

        </div>

      </div>

      <div className="mt-6 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

      <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

      <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

    </div>
  );
}

export default Doctors;
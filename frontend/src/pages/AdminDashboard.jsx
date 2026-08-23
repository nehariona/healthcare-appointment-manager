import { useEffect, useState } from "react";

import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  Stethoscope,
  UserRoundCheck,
  Mail,
  Building2,
  BriefcaseBusiness,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";

import LogoutButton from "../components/LogoutButton";

import {
  getPendingDoctors,
  approveDoctor,
  markDoctorLeave,
} from "../api/api";


// =============================================================
// ADMIN DASHBOARD
// =============================================================

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);

  // Currently processing verification ID
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Doctor selected for profile modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);


  // ===========================================================
  // GET VERIFICATION ID
  // ===========================================================

  function getVerificationId(doctor) {
    return (
      doctor?.verification_id ??
      doctor?.id ??
      null
    );
  }


  // ===========================================================
  // GET DOCTOR ID
  // ===========================================================

  function getDoctorId(doctor) {
    return (
      doctor?.doctor_id ??
      doctor?.user_id ??
      doctor?.doctor?.id ??
      null
    );
  }


  // ===========================================================
  // GET DOCTOR NAME
  // ===========================================================

  function getDoctorName(doctor) {
    return (
      doctor?.full_name ||
      doctor?.doctor_name ||
      doctor?.name ||
      doctor?.user?.full_name ||
      doctor?.user?.name ||
      "Doctor"
    );
  }


  // ===========================================================
  // GET EMAIL
  // ===========================================================

  function getDoctorEmail(doctor) {
    return (
      doctor?.email ||
      doctor?.user?.email ||
      "Email not provided"
    );
  }


  // ===========================================================
  // GET SPECIALIZATION
  // ===========================================================

  function getSpecialization(doctor) {
    return (
      doctor?.specialization ||
      doctor?.specialty ||
      "General Medicine"
    );
  }


  // ===========================================================
  // GET HOSPITAL
  // ===========================================================

  function getHospital(doctor) {
    return (
      doctor?.hospital ||
      doctor?.hospital_name ||
      "Hospital not provided"
    );
  }


  // ===========================================================
  // GET EXPERIENCE
  // ===========================================================

  function getExperience(doctor) {
    return doctor?.experience_years ?? 0;
  }


  // ===========================================================
  // LOAD PENDING DOCTORS
  // ===========================================================

  async function loadDoctors() {
    try {
      setLoading(true);
      setError("");

      const data = await getPendingDoctors();

      console.log("Pending doctors:", data);

      setDoctors(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Unable to load pending doctors:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load pending doctors."
      );

    } finally {
      setLoading(false);
    }
  }


  // ===========================================================
  // INITIAL LOAD
  // ===========================================================

  useEffect(() => {
    loadDoctors();
  }, []);


  // ===========================================================
  // APPROVE DOCTOR
  // ===========================================================

  async function handleApprove(doctor) {
    const verificationId =
      getVerificationId(doctor);

    const doctorName =
      getDoctorName(doctor);

    console.log(
      "Approve clicked:",
      doctor
    );

    console.log(
      "Verification ID:",
      verificationId
    );

    console.log(
      "Doctor ID:",
      getDoctorId(doctor)
    );


    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!verificationId) {
      setError(
        "Unable to identify this doctor's verification request."
      );

      return;
    }


    // ---------------------------------------------------------
    // PREVENT DOUBLE CLICK
    // ---------------------------------------------------------

    if (processingId !== null) {
      return;
    }


    // ---------------------------------------------------------
    // CONFIRM
    // ---------------------------------------------------------

    const confirmed = window.confirm(
      `Approve ${doctorName}?`
    );

    if (!confirmed) {
      return;
    }


    try {

      // -------------------------------------------------------
      // START PROCESSING
      // -------------------------------------------------------

      setProcessingId(verificationId);

      setError("");
      setSuccess("");


      // -------------------------------------------------------
      // CALL BACKEND
      // -------------------------------------------------------

      await approveDoctor(
        verificationId
      );


      // -------------------------------------------------------
      // REMOVE FROM PENDING QUEUE
      //
      // IMPORTANT:
      // We do NOT call loadDoctors() here.
      //
      // This prevents "Approving..." from staying forever
      // if the refresh request takes time.
      // -------------------------------------------------------

      setDoctors((currentDoctors) =>
        currentDoctors.filter(
          (item) =>
            getVerificationId(item) !==
            verificationId
        )
      );


      // -------------------------------------------------------
      // CLOSE PROFILE IF THIS DOCTOR WAS OPEN
      // -------------------------------------------------------

      setSelectedDoctor((currentDoctor) => {

        if (
          currentDoctor &&
          getVerificationId(currentDoctor) ===
            verificationId
        ) {
          return null;
        }

        return currentDoctor;
      });


      // -------------------------------------------------------
      // SUCCESS MESSAGE
      // -------------------------------------------------------

      setSuccess(
        `${doctorName} has been approved successfully.`
      );


      // -------------------------------------------------------
      // STOP SPINNER IMMEDIATELY
      // -------------------------------------------------------

      setProcessingId(null);

    } catch (err) {

      console.error(
        "Approve doctor error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to approve doctor."
      );

      setProcessingId(null);
    }
  }


  // ===========================================================
  // MARK DOCTOR LEAVE
  // ===========================================================

  async function handleLeave(doctor) {

    const doctorId =
      getDoctorId(doctor);

    const doctorName =
      getDoctorName(doctor);


    if (!doctorId) {
      setError(
        "Unable to identify this doctor."
      );

      return;
    }


    if (processingId !== null) {
      return;
    }


    const confirmed = window.confirm(
      `Mark ${doctorName} as on leave?`
    );


    if (!confirmed) {
      return;
    }


    try {

      setProcessingId(doctorId);

      setError("");
      setSuccess("");


      // Today's date
      const today = new Date()
        .toISOString()
        .slice(0, 10);


      await markDoctorLeave(
        doctorId,
        today,
        "Admin approved leave"
      );


      setSuccess(
        `${doctorName} has been marked on leave.`
      );


      // Refresh after leave operation
      await loadDoctors();

    } catch (err) {

      console.error(
        "Mark leave error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update doctor leave."
      );

    } finally {

      setProcessingId(null);
    }
  }


  // ===========================================================
  // REFRESH
  // ===========================================================

  async function handleRefresh() {

    setError("");
    setSuccess("");

    await loadDoctors();
  }


  // ===========================================================
  // VIEW PROFILE
  // ===========================================================

  function handleViewProfile(doctor) {
    setSelectedDoctor(doctor);
  }


  // ===========================================================
  // CLOSE PROFILE
  // ===========================================================

  function closeProfile() {
    setSelectedDoctor(null);
  }


  // ===========================================================
  // STATISTICS
  // ===========================================================

  const hospitalCount =
    doctors.filter(
      (doctor) =>
        doctor?.hospital ||
        doctor?.hospital_name
    ).length;


  const experiencedDoctors =
    doctors.filter(
      (doctor) =>
        Number(
          doctor?.experience_years ?? 0
        ) >= 5
    ).length;


  // ===========================================================
  // UI
  // ===========================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <div className="mx-auto max-w-[1500px] p-3 sm:p-4 xl:p-5">


        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="panel mb-4 p-4 sm:p-5">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Administration
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
                Operations Dashboard
              </h1>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Manage doctor verification, profiles,
                and operational status.
              </p>

            </div>


            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>


              <LogoutButton
                compact={true}
                className="rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-sm font-medium text-[var(--text)]"
              />

            </div>

          </div>

        </div>


        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {success && (

          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">

            <BadgeCheck
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* =====================================================
            STATISTICS
        ====================================================== */}

        <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


          {/* PENDING */}

          <div className="panel p-4">

            <div className="flex items-start justify-between">

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">

                <CalendarClock size={18} />

              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Queue
              </span>

            </div>


            <div className="mt-5">

              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                Pending Doctors
              </div>

              <div className="mt-1 text-[28px] font-semibold tracking-tight text-amber-700 dark:text-amber-300">
                {loading
                  ? "—"
                  : doctors.length}
              </div>

            </div>

          </div>


          {/* HOSPITAL */}

          <div className="panel p-4">

            <div className="flex items-start justify-between">

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">

                <Building2 size={18} />

              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Profiles
              </span>

            </div>


            <div className="mt-5">

              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                Hospital Details
              </div>

              <div className="mt-1 text-[28px] font-semibold tracking-tight text-blue-700 dark:text-blue-300">
                {loading
                  ? "—"
                  : hospitalCount}
              </div>

            </div>

          </div>


          {/* EXPERIENCE */}

          <div className="panel p-4">

            <div className="flex items-start justify-between">

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">

                <BriefcaseBusiness size={18} />

              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Experience
              </span>

            </div>


            <div className="mt-5">

              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                5+ Years
              </div>

              <div className="mt-1 text-[28px] font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
                {loading
                  ? "—"
                  : experiencedDoctors}
              </div>

            </div>

          </div>


          {/* VERIFICATION */}

          <div className="panel p-4">

            <div className="flex items-start justify-between">

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">

                <UserRoundCheck size={18} />

              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Operations
              </span>

            </div>


            <div className="mt-5">

              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                Verification
              </div>

              <div className="mt-1 text-[28px] font-semibold tracking-tight text-rose-700 dark:text-rose-300">
                {loading
                  ? "—"
                  : "Review"}
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            APPROVAL QUEUE
        ====================================================== */}

        <section className="panel p-4 sm:p-5">


          <div className="mb-4 flex items-center justify-between gap-3">

            <div>

              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Provider Management
              </div>

              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">
                Doctor Approval Queue
              </h2>

            </div>


            <span className="inline-flex items-center rounded-full bg-[var(--subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">

              {doctors.length} pending

            </span>

          </div>


          {/* ===================================================
              LOADING
          ==================================================== */}

          {loading ? (

            <div className="space-y-3">

              {Array.from({
                length: 3
              }).map((_, index) => (

                <div
                  key={index}
                  className="skeleton h-28 w-full rounded-2xl"
                />

              ))}

            </div>


          ) : doctors.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================== */

            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--subtle)] p-10 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">

                <BadgeCheck size={20} />

              </div>

              <div className="text-base font-semibold text-[var(--text)]">
                Queue is clear
              </div>

              <div className="mt-1 text-sm text-[var(--muted)]">
                There are no doctor verification
                requests waiting for review.
              </div>

            </div>


          ) : (

            /* =================================================
               DOCTOR LIST
            ================================================== */

            <div className="space-y-3">

              {doctors.map((doctor) => {

                const verificationId =
                  getVerificationId(doctor);

                const doctorId =
                  getDoctorId(doctor);

                const doctorName =
                  getDoctorName(doctor);

                const email =
                  getDoctorEmail(doctor);

                const specialization =
                  getSpecialization(doctor);

                const hospital =
                  getHospital(doctor);

                const experience =
                  getExperience(doctor);

                const isProcessing =
                  processingId ===
                  verificationId;


                return (

                  <div
                    key={
                      verificationId ??
                      doctorId
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 transition hover:border-blue-300 dark:hover:border-blue-500/40"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                      {/* =================================================
                          DOCTOR DETAILS
                      ================================================== */}

                      <div className="flex min-w-0 items-start gap-3">


                        {/* AVATAR */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-base font-bold text-[var(--primary)]">

                          {doctorName
                            .charAt(0)
                            .toUpperCase()}

                        </div>


                        <div className="min-w-0">


                          {/* NAME */}

                          <div className="text-base font-semibold text-[var(--text)]">

                            {doctorName}

                          </div>


                          {/* TAGS */}

                          <div className="mt-2 flex flex-wrap gap-2">


                            {/* SPECIALIZATION */}

                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">

                              <Stethoscope
                                size={12}
                              />

                              {specialization}

                            </span>


                            {/* HOSPITAL */}

                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

                              <Building2
                                size={12}
                              />

                              {hospital}

                            </span>


                            {/* EXPERIENCE */}

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">

                              <BriefcaseBusiness
                                size={12}
                              />

                              {experience} years

                            </span>

                          </div>


                          {/* EMAIL + IDS */}

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[var(--muted)]">


                            <span className="flex items-center gap-1">

                              <Mail size={12} />

                              {email}

                            </span>


                            <span>
                              Doctor ID:{" "}
                              {doctorId ??
                                "N/A"}
                            </span>


                            <span>
                              Verification ID:{" "}
                              {verificationId ??
                                "N/A"}
                            </span>

                          </div>

                        </div>

                      </div>


                      {/* =================================================
                          ACTIONS
                      ================================================== */}

                      <div className="flex shrink-0 flex-wrap gap-2">


                        {/* VIEW PROFILE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleViewProfile(
                              doctor
                            )
                          }
                          disabled={
                            processingId !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >

                          <Eye size={14} />

                          View Profile

                        </button>


                        {/* APPROVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              doctor
                            )
                          }
                          disabled={
                            processingId !==
                              null ||
                            !verificationId
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {isProcessing ? (

                            <>

                              <svg
                                className="h-4 w-4 animate-spin"
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

                              Approving...

                            </>

                          ) : (

                            <>

                              <BadgeCheck
                                size={14}
                              />

                              Approve

                            </>

                          )}

                        </button>


                        {/* MARK LEAVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleLeave(
                              doctor
                            )
                          }
                          disabled={
                            processingId !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >

                          <CalendarClock
                            size={14}
                          />

                          Mark Leave

                        </button>

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </div>


      {/* =======================================================
          PROFILE MODAL
      ======================================================== */}

      {selectedDoctor && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeProfile();
            }

          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">


            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">

              <div>

                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Doctor Profile
                </div>

                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">

                  {getDoctorName(
                    selectedDoctor
                  )}

                </h3>

              </div>


              <button
                type="button"
                onClick={closeProfile}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            {/* =================================================
                MODAL CONTENT
            ================================================== */}

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">


              {/* NAME */}

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">

                    {getDoctorName(
                      selectedDoctor
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>


                  <div>

                    <div className="text-base font-semibold text-slate-900 dark:text-white">

                      {getDoctorName(
                        selectedDoctor
                      )}

                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400">

                      {getSpecialization(
                        selectedDoctor
                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* DETAILS */}

              <div className="grid gap-3 sm:grid-cols-2">


                <ProfileItem
                  icon={
                    <Mail size={16} />
                  }
                  label="Email"
                  value={getDoctorEmail(
                    selectedDoctor
                  )}
                />


                <ProfileItem
                  icon={
                    <Building2 size={16} />
                  }
                  label="Hospital"
                  value={getHospital(
                    selectedDoctor
                  )}
                />


                <ProfileItem
                  icon={
                    <Stethoscope size={16} />
                  }
                  label="Specialization"
                  value={getSpecialization(
                    selectedDoctor
                  )}
                />


                <ProfileItem
                  icon={
                    <BriefcaseBusiness
                      size={16}
                    />
                  }
                  label="Experience"
                  value={`${getExperience(
                    selectedDoctor
                  )} years`}
                />


                <ProfileItem
                  icon={
                    <UserRoundCheck
                      size={16}
                    />
                  }
                  label="Doctor ID"
                  value={String(
                    getDoctorId(
                      selectedDoctor
                    ) ?? "N/A"
                  )}
                />


                <ProfileItem
                  icon={
                    <ShieldCheck
                      size={16}
                    />
                  }
                  label="Verification ID"
                  value={String(
                    getVerificationId(
                      selectedDoctor
                    ) ?? "N/A"
                  )}
                />

              </div>


              {/* GOVERNMENT ID */}

              <ProfileItem
                icon={
                  <ShieldCheck size={16} />
                }
                label="Government ID"
                value={
                  selectedDoctor
                    ?.government_id_number ||
                  "Not provided"
                }
              />


              {/* MEDICAL LICENSE */}

              <ProfileItem
                icon={
                  <ShieldCheck size={16} />
                }
                label="Medical License Number"
                value={
                  selectedDoctor
                    ?.medical_license_number ||
                  "Not provided"
                }
              />


              {/* STATUS */}

              <ProfileItem
                icon={
                  <BadgeCheck size={16} />
                }
                label="Status"
                value={
                  selectedDoctor?.status ||
                  "Pending Verification"
                }
              />

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================== */}

            <div className="flex justify-end border-t border-slate-200 px-5 py-4 dark:border-slate-800">

              <button
                type="button"
                onClick={closeProfile}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// =============================================================
// PROFILE ITEM
// =============================================================

function ProfileItem({
  icon,
  label,
  value,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">

        {icon}

        {label}

      </div>

      <div className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-white">

        {value}

      </div>

    </div>

  );
}
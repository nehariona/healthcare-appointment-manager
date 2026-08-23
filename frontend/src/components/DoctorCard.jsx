import {
  CalendarDays,
  Clock3,
  Stethoscope,
  Building2,
  ArrowRight,
  UserRound,
} from "lucide-react";

function DoctorCard({ doctor, onBook }) {
  if (!doctor) return null;

  // ================================
  // DATABASE DOCTOR ID
  // ================================

  const doctorId = doctor.id;

  // ================================
  // BACKEND DATA
  // ================================

  const specialization =
    doctor.specialization || "Specialist";

  const experience =
    doctor.experience_years;

  const hospital =
    doctor.hospital;

  const workingStart =
    doctor.working_start;

  const workingEnd =
    doctor.working_end;

  const slotDuration =
    doctor.slot_duration;

  // ================================
  // DISPLAY NAME
  // ================================
  //
  // Your /doctors API currently does
  // NOT return the doctor's name.
  //
  // So DON'T invent a random name.
  //

  const doctorName =
    doctor.full_name ||
    doctor.name ||
    doctor.doctor_name ||
    `Doctor #${doctorId}`;

  const cleanName = String(doctorName)
    .replace(/^Dr\.?\s*/i, "")
    .trim();

  // ================================
  // INITIALS
  // ================================

  const initials =
    cleanName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase()
      )
      .join("") || "DR";

  // ================================
  // TIME FORMAT
  // ================================

  function formatTime(time) {
    if (!time) return null;

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  }

  return (
    <article
      className="
        group flex h-full flex-col overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
        transition-all duration-200
        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-xl
        dark:border-slate-800
        dark:bg-slate-900
        dark:hover:border-blue-500/40
      "
    >

      {/* TOP ACCENT */}

      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

      <div className="flex flex-1 flex-col p-6">

        {/* ================================
            HEADER
        ================================= */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-center gap-4">

            {/* AVATAR */}

            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-2xl
                bg-blue-50
                text-lg font-bold
                text-blue-700
                ring-1 ring-blue-100
                dark:bg-blue-500/10
                dark:text-blue-400
                dark:ring-blue-500/20
              "
            >
              {initials}
            </div>

            {/* NAME */}

            <div className="min-w-0">

              <h2
                className="
                  truncate
                  text-lg font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Dr. {cleanName}
              </h2>

              <div
                className="
                  mt-1 flex items-center gap-1.5
                  text-sm font-medium
                  text-blue-600
                  dark:text-blue-400
                "
              >
                <Stethoscope size={15} />

                <span>
                  {specialization}
                </span>
              </div>

            </div>

          </div>

          {/* STATUS */}

          <div
            className="
              flex shrink-0 items-center gap-1.5
              rounded-full
              border border-emerald-200
              bg-emerald-50
              px-2.5 py-1
              text-[10px] font-bold
              uppercase tracking-wide
              text-emerald-700
              dark:border-emerald-500/20
              dark:bg-emerald-500/10
              dark:text-emerald-400
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Available
          </div>

        </div>

        {/* DIVIDER */}

        <div
          className="
            my-5 h-px
            bg-slate-100
            dark:bg-slate-800
          "
        />

        {/* ================================
            DETAILS
        ================================= */}

        <div className="space-y-4">

          {/* DOCTOR ID */}

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >
              <UserRound size={16} />
            </div>

            <div>

              <p
                className="
                  text-[10px] font-bold
                  uppercase tracking-wide
                  text-slate-400
                "
              >
                Doctor ID
              </p>

              <p
                className="
                  text-sm font-semibold
                  text-slate-700
                  dark:text-slate-300
                "
              >
                #{doctorId}
              </p>

            </div>

          </div>

          {/* HOSPITAL */}

          {hospital && (
            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-lg
                  bg-slate-100
                  text-slate-500
                  dark:bg-slate-800
                  dark:text-slate-400
                "
              >
                <Building2 size={16} />
              </div>

              <div className="min-w-0">

                <p
                  className="
                    text-[10px] font-bold
                    uppercase tracking-wide
                    text-slate-400
                  "
                >
                  Hospital
                </p>

                <p
                  className="
                    truncate text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {hospital}
                </p>

              </div>

            </div>
          )}

          {/* EXPERIENCE */}

          {experience !== null &&
            experience !== undefined && (
              <div className="flex items-center gap-3">

                <div
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-slate-100
                    text-slate-500
                    dark:bg-slate-800
                    dark:text-slate-400
                  "
                >
                  <Clock3 size={16} />
                </div>

                <div>

                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Experience
                  </p>

                  <p
                    className="
                      text-sm font-semibold
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    {experience}{" "}
                    {Number(experience) === 1
                      ? "year"
                      : "years"}
                  </p>

                </div>

              </div>
            )}

          {/* WORKING HOURS */}

          {workingStart &&
            workingEnd && (
              <div className="flex items-center gap-3">

                <div
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-slate-100
                    text-slate-500
                    dark:bg-slate-800
                    dark:text-slate-400
                  "
                >
                  <Clock3 size={16} />
                </div>

                <div>

                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Working Hours
                  </p>

                  <p
                    className="
                      text-sm font-semibold
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    {formatTime(workingStart)}
                    {" – "}
                    {formatTime(workingEnd)}
                  </p>

                </div>

              </div>
            )}

        </div>

        {/* PUSH BUTTON */}

        <div className="flex-1" />

        {/* BOOK BUTTON */}

        <button
          type="button"
          disabled={!doctorId}
          onClick={() => onBook?.(doctor)}
          className="
            mt-6 flex h-11 w-full
            items-center justify-center
            gap-2 rounded-xl
            bg-blue-600
            text-sm font-bold
            text-white
            shadow-sm
            transition-all
            hover:bg-blue-700
            hover:shadow-md
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <CalendarDays size={16} />

          Book Appointment

          <ArrowRight
            size={16}
            className="
              transition-transform
              group-hover:translate-x-1
            "
          />

        </button>

      </div>

    </article>
  );
}

export default DoctorCard;
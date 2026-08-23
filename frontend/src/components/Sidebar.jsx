import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Bell,
  UserRound,
  ChevronRight,
} from "lucide-react";

function Sidebar({
  active,
  onNavigate,
}) {
  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "doctors",
      label: "Find Doctors",
      icon: Stethoscope,
    },
    {
      id: "appointments",
      label: "My Appointments",
      icon: CalendarDays,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: UserRound,
    },
  ];

  return (
    <aside
      className="
        flex w-full flex-col
        border-b border-slate-200
        bg-white p-3
        dark:border-slate-800
        dark:bg-slate-900

        lg:min-h-screen
        lg:w-64
        lg:border-b-0
        lg:border-r
        lg:p-4
      "
    >

      {/* HEADER */}

      <div className="mb-4 px-3 pt-2">

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-slate-400
          "
        >
          Workspace
        </p>

        <h2
          className="
            mt-1
            text-sm
            font-bold
            text-slate-800
            dark:text-white
          "
        >
          Patient Menu
        </h2>

      </div>

      {/* NAVIGATION */}

      <nav className="space-y-1">

        {items.map((item) => {

          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`
                group
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-semibold
                transition-all
                duration-200

                ${
                  isActive
                    ? `
                      bg-blue-50
                      text-blue-700
                      shadow-sm
                      dark:bg-blue-500/10
                      dark:text-blue-400
                    `
                    : `
                      text-slate-600
                      hover:bg-slate-50
                      hover:text-slate-900
                      dark:text-slate-400
                      dark:hover:bg-slate-800
                      dark:hover:text-white
                    `
                }
              `}
            >

              {/* ICON */}

              <span
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  transition

                  ${
                    isActive
                      ? `
                        bg-blue-600
                        text-white
                        shadow-sm
                      `
                      : `
                        bg-slate-100
                        text-slate-500
                        group-hover:bg-slate-200
                        group-hover:text-slate-700
                        dark:bg-slate-800
                        dark:text-slate-400
                        dark:group-hover:bg-slate-700
                        dark:group-hover:text-slate-200
                      `
                  }
                `}
              >
                <Icon size={17} strokeWidth={2} />
              </span>

              {/* LABEL */}

              <span className="flex-1">
                {item.label}
              </span>

              {/* ACTIVE ARROW */}

              {isActive && (
                <ChevronRight
                  size={16}
                  className="text-blue-500"
                />
              )}

            </button>
          );
        })}

      </nav>

      {/* BOTTOM INFO */}

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-blue-100
          bg-blue-50
          p-4
          dark:border-blue-500/20
          dark:bg-blue-500/10
        "
      >

        <div className="flex items-center gap-2">

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-blue-600
              text-white
            "
          >
            <Stethoscope size={15} />
          </div>

          <div>

            <p
              className="
                text-xs
                font-bold
                text-blue-900
                dark:text-blue-300
              "
            >
              Care Center
            </p>

            <p
              className="
                mt-0.5
                text-[10px]
                text-blue-600
                dark:text-blue-400
              "
            >
              Manage your healthcare
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
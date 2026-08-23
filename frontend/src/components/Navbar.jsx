import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle(
      "dark",
      darkMode
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  function toggleTheme() {
    setDarkMode((current) => !current);
  }

  const roleLabel =
    user?.role === "patient"
      ? "Patient"
      : user?.role === "doctor"
        ? "Doctor"
        : user?.role === "admin"
          ? "Administrator"
          : user?.role;

  return (
    <header className="top-navbar">

      {/* BRAND */}

      <div className="navbar-brand">

        <div className="brand-icon">
          +
        </div>

        <div className="brand-text">

          <strong>
            HealthCare
          </strong>

          <span>
            Appointment Manager
          </span>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="navbar-actions">

        {/* THEME */}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={
            darkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >

          <span className="theme-icon">
            {darkMode ? "☀" : "☾"}
          </span>

          <span className="theme-label">
            {darkMode ? "Light" : "Dark"}
          </span>

        </button>

        {/* USER */}

        <div className="navbar-user">

          <div className="user-avatar">
            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div className="user-info">

            <strong>
              {user?.full_name || "User"}
            </strong>

            <span>
              {roleLabel}
            </span>

          </div>

        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="navbar-logout"
          onClick={logout}
          title="Logout"
        >
          Logout
        </button>

      </div>

    </header>
  );
}

export default Navbar;

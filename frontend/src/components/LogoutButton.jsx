import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LogoutButton({ className = "", label = "Logout", compact = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ||
        `inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-rose-200 hover:text-rose-600 ${compact ? "px-2.5 py-2" : ""}`
      }
      aria-label="Logout"
      title="Logout"
    >
      <LogOut size={16} />
      {!compact && <span>{label}</span>}
    </button>
  );
}

import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import "./topbar.css";

const PATH_LABELS = {
  dashboard: "Overview",
  topics: "Project Topics",
  tasks: "Working Board",
  activity: "Commits Stream",
  sync: "Jira Synchronizer",
};

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const currentPath =
    location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const pathLabel = PATH_LABELS[currentPath] || "Page";

  const initials = useMemo(() => {
    return (
      user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "JD"
    );
  }, [user]);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="breadcrumb">
          <span>{user?.role || "User"}</span>
          <span>/</span>
          <span className="breadcrumb__item">{pathLabel}</span>
        </div>
      </div>

      <div className="topbar__right">
        <button className="btn-icon" title="Notifications">
          🔔
        </button>
        <button className="btn-icon" title="Help">
          ❓
        </button>

        <div className="user-wrap" style={{ position: "relative" }}>
          <button
            className="topbar__user-btn"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <div className="topbar__avatar">{initials}</div>
            <span className="topbar__name">{user?.name || "Member"}</span>
            <span className="topbar__chev">{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div className="dropdown" onMouseLeave={() => setOpen(false)}>
              <div className="dropdown__header">
                <span className="dropdown__name">{user?.name}</span>
                <span className="dropdown__role">{user?.role}</span>
              </div>
              <button className="dropdown__item" type="button">
                <span>👤</span> Account Settings
              </button>
              <button
                className="dropdown__item dropdown__item--danger"
                type="button"
                onClick={logout}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

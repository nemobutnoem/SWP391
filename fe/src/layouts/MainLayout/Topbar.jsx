import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import "./topbar.css";

const PATH_LABELS = {
  dashboard: "Overview",
  topics: "Project Topics",
  tasks: "Working Board",
  activity: "Commits Stream",
  sync: "Code Activities",
  account: "Account Settings",
};

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath =
    location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const pathLabel = PATH_LABELS[currentPath] || "Page";

  const initials = useMemo(() => {
    const safeName =
      typeof user?.name === "string" ? user.name : user?.account || "Guest";
    return (
      safeName
        .split(" ")
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
          !
        </button>
        <button className="btn-icon" title="Help">
          ?
        </button>

        <div className="user-wrap" style={{ position: "relative" }}>
          <button
            className="topbar__user-btn"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <div className="topbar__avatar">{initials}</div>
            <span className="topbar__name">
              {typeof user?.name === "string" ? user.name : user?.account || "Member"}
            </span>
            <span className="topbar__chev">{open ? "^" : "v"}</span>
          </button>

          {open && (
            <div className="dropdown" onMouseLeave={() => setOpen(false)}>
              <div className="dropdown__header">
                <span className="dropdown__name">
                  {typeof user?.name === "string" ? user.name : user?.account || "Member"}
                </span>
                <span className="dropdown__role">{user?.role}</span>
              </div>
              <button
                className="dropdown__item"
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/account");
                }}
              >
                <span>Profile</span> Account Settings
              </button>
              <button
                className="dropdown__item dropdown__item--danger"
                type="button"
                onClick={logout}
              >
                <span>Exit</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


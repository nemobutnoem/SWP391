import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import { useTeamContext } from "../../store/teamContext/teamContext.js";
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
  const teamCtx = useTeamContext();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isTeamUser = user?.role === ROLES.TEAM_LEAD || user?.role === ROLES.TEAM_MEMBER;

  const studyContext = isTeamUser
    ? {
        semesterLabel: teamCtx?.selectedGroup?.semesterLabel ?? null,
        classLabel: teamCtx?.selectedGroup?.classLabel ?? null,
        topicLabel: teamCtx?.selectedGroup?.topicLabel ?? null,
      }
    : { semesterLabel: null, classLabel: null, topicLabel: null };

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
        <div>
          <div className="breadcrumb">
            <span>{user?.role || "User"}</span>
            <span>/</span>
            <span className="breadcrumb__item">{pathLabel}</span>
          </div>

          {isTeamUser && (
            <div className="topbar__study-context">
              <span className="topbar__value">
                Semester:{" "}
                <select
                  className="topbar__context-select"
                  value={teamCtx?.selectedSemesterId ?? ""}
                  onChange={(e) => teamCtx?.setSelectedSemesterId?.(e.target.value)}
                  disabled={!teamCtx?.isTeamUser || teamCtx?.isLoading || (teamCtx?.semesterOptions?.length ?? 0) <= 1}
                  title={(teamCtx?.semesterOptions?.length ?? 0) <= 1 ? "Không có kì khác để chọn" : "Chọn kì để xem"}
                >
                  {(teamCtx?.semesterOptions || []).map((s) => (
                    <option key={s.semesterId} value={s.semesterId}>
                      {s.semesterLabel}
                      {s.semesterStatus === "active" ? " (Active)" : ""}
                    </option>
                  ))}
                </select>
              </span>
              <span className="topbar__dot">•</span>
              <span className="topbar__value">Class: {studyContext.classLabel || "-"}</span>
              <span className="topbar__dot">•</span>
              <span className="topbar__value topbar__topic">Topic: {studyContext.topicLabel || "-"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="topbar__right">
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


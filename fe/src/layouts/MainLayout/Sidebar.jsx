import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../store/auth/auth.context.jsx";
import { ROLES } from "../../routes/access/roles.js";
import "./sidebar.css";


const navClass = ({ isActive }) => `navItem ${isActive ? "navItem--active" : ""}`;

export function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === ROLES.ADMIN;
  const isLecturer = role === ROLES.LECTURER;
  const isTeam = role === ROLES.LEADER || role === ROLES.MEMBER;

  return (
    <aside className="sidebar">
      <div className="brand">SWP</div>

      <nav className="nav">
        <NavLink to="/dashboard" className={navClass}>
          <span className="dot" />
          Dashboard
        </NavLink>

        {isTeam && (
          <NavLink to="/issues" className={navClass}>
            <span className="dot" />
            Tasks
          </NavLink>
        )}

        {isTeam && (
          <NavLink to="/activity" className={navClass}>
            <span className="dot" />
            Commits (GitHub)
          </NavLink>
        )}

        {isTeam && (
          <NavLink to="/sync" className={navClass}>
            <span className="dot" />
            Requirements (Jira)
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/topics" className={navClass}>
            <span className="dot" />
            Topics
          </NavLink>
        )}

        {(isLecturer || isTeam) && (
          <NavLink to="/activity" className={navClass}>
            <span className="dot" />
            Progress
          </NavLink>
        )}
      </nav>

      <div className="sidebarFooter">
        <div className="rolePill">{role || "guest"}</div>
      </div>
    </aside>
  );
}
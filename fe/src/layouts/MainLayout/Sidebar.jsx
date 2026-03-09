import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import "./sidebar.css";

const navClass = ({ isActive }) =>
  `navItem ${isActive ? "navItem--active" : ""}`;

export function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === ROLES.ADMIN;
  const isLecturer = role === ROLES.LECTURER;
  const isTeam = role === ROLES.TEAM_LEAD || role === ROLES.TEAM_MEMBER;

  const safeName = typeof user?.name === "string" ? user.name : (user?.account || "Guest");
  const userInitials =
    safeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "JD";

  return (
    <aside className="sidebar">
      <div className="brand">
        <NavLink to="/dashboard" className="brandLink">
          <div className="brandIcon">N</div>
          <span>SWP</span>
        </NavLink>
      </div>

      <nav className="nav">
        {/* Basic Section for all */}
        <div className="navGroup">
          <div className="navLabel">General</div>
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="navGroup">
            <div className="navLabel">Administration</div>
            <NavLink to="/topics" className={navClass}>
              Project Topics
            </NavLink>
            <NavLink to="/users" className={navClass}>
              User Management
            </NavLink>
            <NavLink to="/semesters" className={navClass}>
              Semesters & Classes
            </NavLink>
            <NavLink to="/allocations" className={navClass}>
              Group Allocations
            </NavLink>
            <NavLink to="/admin/integrations" className={navClass}>
              Integration Settings
            </NavLink>
          </div>
        )}

        {/* Lecturer Section */}
        {isLecturer && (
          <div className="navGroup">
            <div className="navLabel">My Teaching</div>
            <NavLink to="/classes" className={navClass}>
              My Groups
            </NavLink>
            <NavLink to="/grading" className={navClass}>
              Grading
            </NavLink>
            <NavLink to="/srs" className={navClass}>
              SRS Requirements
            </NavLink>
          </div>
        )}

        {/* Student Section */}
        {isTeam && (
          <div className="navGroup">
            <div className="navLabel">My Project</div>
            <NavLink to="/tasks" className={navClass}>
              Working Board
            </NavLink>
            <NavLink to="/sync" className={navClass}>
              Code Activities
            </NavLink>
            <NavLink to="/group/integrations" className={navClass}>
              Integration Settings
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebarFooter">
        <div className="userCard">
          <div className="userAvatar">{userInitials}</div>
          <div className="userInfo">
            <div className="userName">{safeName}</div>
            <div className="userRole">{role || "No Role"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

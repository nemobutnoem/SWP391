import React, { useMemo, useState } from "react";
import { useAuth } from "../../store/auth/useAuth.jsx";
import "./topbar.css";

function initials(name = "User") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const avatarText = useMemo(() => initials(user?.name || "John Doe"), [user]);

  return (
    <header className="topbar">
      <div className="topbarTitle">Overview</div>

      <div className="topbarRight">
        <div className="userWrap">
          <button
            className="userBtn"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <span className="avatar">{avatarText}</span>
            <span className="userName">{user?.name || "John Doe"}</span>
            <span className="chev">{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div className="dropdown" onMouseLeave={() => setOpen(false)}>
              <div className="dropdownHeader">
                <div className="dropdownName">{user?.name || "John Doe"}</div>
                <div className="dropdownRole">{user?.role}</div>
              </div>
              <button className="ddItem" type="button" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
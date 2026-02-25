import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import "./mainLayout.css";

export function MainLayout() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <main className="content">
          <div className="content__container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

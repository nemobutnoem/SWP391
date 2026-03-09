import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminDashboardView } from "./AdminDashboardView.jsx";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
export function AdminDashboardPage({ adminStats, systemLogs }) {
  const navigate = useNavigate();

  return (
    <AdminDashboardView
      adminStats={adminStats}
      systemLogs={systemLogs}
      onNavigateSystemLogs={() => navigate("/admin/integrations")}
      onNavigateSemesters={() => navigate("/semesters")}
    />
  );
}

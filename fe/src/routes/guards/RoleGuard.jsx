import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth/auth.context.jsx";

export function RoleGuard({ allow = [] }) {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) return <Navigate to="/login" replace />;
  if (allow.length === 0) return <Outlet />;

  const ok = allow.includes(role);
  return ok ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
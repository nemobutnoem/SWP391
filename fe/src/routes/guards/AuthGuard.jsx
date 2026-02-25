import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";

export function AuthGuard() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
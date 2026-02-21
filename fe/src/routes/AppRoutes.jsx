import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthGuard } from "./guards/AuthGuard.jsx";
import { RoleGuard } from "./guards/RoleGuard.jsx";
import { ROLES } from "./access/roles.js";

import { MainLayout } from "../layouts/MainLayout/MainLayout.jsx";

import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { DashboardPage } from "../pages/dashboard/DashboardPage.jsx";
import { ForbiddenPage } from "../pages/auth/ForbiddenPage.jsx";
import { NotFoundPage } from "../pages/auth/NotFoundPage.jsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin: chỉ topics */}
          <Route element={<RoleGuard allow={[ROLES.ADMIN]} />}>
          </Route>

          {/* Lecturer: chỉ xem tiến trình */}
          <Route element={<RoleGuard allow={[ROLES.LECTURER]} />}>
          </Route>

          {/* Team Lead + Team Member: work area + sync */}
          <Route element={<RoleGuard allow={[ROLES.LEADER, ROLES.MEMBER]} />}>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
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

import { MockSmokeTestPage } from "../pages/dev/MockSmokeTestPage.jsx";
import { TasksBoardPage } from "../pages/tasks/TasksBoardPage.jsx";
import { SRSBuilderPage } from "../pages/srs/SRSBuilderPage.jsx";
import { ActivityPage } from "../pages/sync/ActivityPage.jsx";
import { SyncPage } from "../pages/sync/SyncPage.jsx";
import { TopicsPage } from "../pages/sync/TopicsPage.jsx";
import { UserManagementPage } from "../pages/admin/UserManagementPage.jsx";
import { AllocationPage } from "../pages/admin/AllocationPage.jsx";
import { MyGroupsPage } from "../pages/lecturer/MyGroupsPage.jsx";
import { GradingPage } from "../pages/lecturer/GradingPage.jsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin - High Level Management */}
          <Route element={<RoleGuard allow={[ROLES.ADMIN]} />}>
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/allocations" element={<AllocationPage />} />
          </Route>

          {/* Lecturer - Academic Management */}
          <Route element={<RoleGuard allow={[ROLES.LECTURER]} />}>
            <Route path="/classes" element={<MyGroupsPage />} />
            <Route path="/grading" element={<GradingPage />} />
          </Route>

          {/* Student - Project & Task Management */}
          <Route element={<RoleGuard allow={[ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER]} />}>
            <Route path="/tasks" element={<TasksBoardPage />} />
            <Route path="/srs" element={<SRSBuilderPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/sync" element={<SyncPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

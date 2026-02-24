import React, { useMemo } from "react";
import { DashboardView } from "./DashboardView.jsx";
import { MOCK_TASKS } from "../../features/tasks/mock/mockTasks.js";
import { computeTaskStats } from "../../features/tasks/taskStats.js";

export function DashboardPage() {
  // Later: replace MOCK_TASKS with tasks from BE/service
  const stats = useMemo(() => computeTaskStats(MOCK_TASKS), []);

  return <DashboardView stats={stats} />;
}
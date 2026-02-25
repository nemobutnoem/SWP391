import React, { useMemo } from "react";
import { DashboardView } from "./DashboardView.jsx";
import {
  getJiraTasks,
  getGithubActivities,
  getGroups,
  getTopics,
} from "../../services/mockDb.service.js";
import { computeTaskStats } from "../../features/tasks/taskStats.js";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { AdminDashboardView } from "./AdminDashboardView.jsx";
import { LecturerDashboardView } from "../lecturer/LecturerDashboardView.jsx";
import { ROLES } from "../../routes/access/roles.js";

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isLecturer = user?.role === ROLES.LECTURER;

  const [localTasks, setLocalTasks] = React.useState(() => getJiraTasks());
  const [localActivities, setLocalActivities] = React.useState(() =>
    getGithubActivities(),
  );

  const stats = useMemo(() => computeTaskStats(localTasks), [localTasks]);

  // Admin Data
  const adminStats = useMemo(() => {
    const allGroups = getGroups();
    const allTopics = getTopics();
    const allocated = allGroups.filter((g) => g.project_id).length;
    return {
      totalGroups: allGroups.length,
      allocatedGroups: allocated,
      allocationPct: Math.round((allocated / allGroups.length) * 100),
      activeLecturers: 5, // Mocked
      totalTopics: allTopics.length,
    };
  }, []);

  const systemLogs = [
    {
      type: "primary",
      message: "New topic 'Healthcare AI' created by Admin",
      time: "2h ago",
    },
    {
      type: "success",
      message: "Group 'SE1701_G01' successfully allocated to Topic #201",
      time: "4h ago",
    },
    {
      type: "warning",
      message: "System maintenance scheduled for Sat, 2AM",
      time: "1d ago",
    },
  ];

  const handleCreateTask = (partialTask) => {
    const newTask = {
      ...partialTask,
      status: "TODO",
      jira_issue_key: `VIBE-${Math.floor(Math.random() * 900) + 100}`,
      occurred_at: new Date().toISOString(),
    };

    // Add to tasks
    setLocalTasks((prev) => [newTask, ...prev]);

    // Also simulate a GitHub activity for this creation
    const activity = {
      id: Date.now(),
      github_username: user?.github_username || "unknown",
      activity_type: "create",
      commit_message: `Created task: ${newTask.title}`,
      occurred_at: newTask.occurred_at,
      pushed_commit_count: 0,
    };
    setLocalActivities((prev) => [activity, ...prev]);
  };

  const handleExportReport = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fileName: `VibeSync_Status_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
          stats: stats,
        });
      }, 2500);
    });
  };

  if (isAdmin) {
    return (
      <AdminDashboardView adminStats={adminStats} systemLogs={systemLogs} />
    );
  }

  if (isLecturer) {
    return <LecturerDashboardView />;
  }

  return (
    <DashboardView
      stats={stats}
      activities={localActivities}
      onCreateTask={handleCreateTask}
      onExportReport={handleExportReport}
    />
  );
}

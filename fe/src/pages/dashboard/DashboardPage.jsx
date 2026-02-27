import React, { useEffect, useMemo, useState } from "react";
import { DashboardView } from "./DashboardView.jsx";
import { computeTaskStats } from "../../features/tasks/taskStats.js";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { AdminDashboardView } from "./AdminDashboardView.jsx";
import { LecturerDashboardView } from "../lecturer/LecturerDashboardView.jsx";
import { ROLES } from "../../routes/access/roles.js";

import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { syncService } from "../../services/sync/sync.service.js";

function normalizeStatus(s) {
  const v = String(s ?? "").trim().toUpperCase();
  if (v === "TODO" || v === "TO_DO" || v === "TO DO") return "TODO";
  if (v === "INPROGRESS" || v === "IN_PROGRESS" || v === "IN PROGRESS") return "IN_PROGRESS";
  if (v === "INREVIEW" || v === "IN_REVIEW" || v === "IN REVIEW") return "IN_REVIEW";
  if (v === "DONE") return "DONE";
  return "TODO";
}

function normalizeJiraTask(t) {
  return {
    id: String(t.id),
    title: t.title ?? t.summary ?? t.jira_issue_key ?? `Task #${t.id}`,
    dueDate: t.dueDate ?? t.due_date ?? t.jira_due_date ?? t.duedate ?? "",
    assigneeName:
      t.assigneeName ??
      t.assignee_name ??
      t.assignee ??
      (t.assignee_user_id ? `User #${t.assignee_user_id}` : "Unassigned"),
    status: normalizeStatus(t.status),
    _raw: t,
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isLecturer = user?.role === ROLES.LECTURER;

  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  const load = async () => {
    const [taskData, activityData] = await Promise.all([
      jiraTaskService.list(),
      githubActivityService.list(),
    ]);

    setTasks((Array.isArray(taskData) ? taskData : []).map(normalizeJiraTask));
    setActivities(Array.isArray(activityData) ? activityData : []);
  };

  useEffect(() => {
    load().catch((e) => console.error("[Dashboard] load failed:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.syncAll();

      await load();
    } catch (e) {
      console.error("[Dashboard] sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Admin/Lecturer giữ nguyên như bạn đang làm (nếu 2 view này đang cần mockDb thì để riêng)
  if (isAdmin) return <AdminDashboardView />;
  if (isLecturer) return <LecturerDashboardView />;

  return (
    <DashboardView
      stats={stats}
      activities={activities}
      onSync={handleSync}
      isSyncing={isSyncing}
    />
  );
}
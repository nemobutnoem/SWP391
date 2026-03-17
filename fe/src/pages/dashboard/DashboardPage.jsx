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
import { semesterService } from "../../services/semesters/semester.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { syncLogService } from "../../services/syncLogs/syncLog.service.js";

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

function mapSystemLog(log) {
  const rawStatus = String(log.status || log.type || "").toLowerCase();
  return {
    type: rawStatus === "success" ? "success" : rawStatus === "failed" || rawStatus === "error" ? "warning" : "info",
    message:
      log.message ||
      [log.target, log.action, log.entity_type || log.entityType]
        .filter(Boolean)
        .join(" • ") ||
      "System sync activity",
    time: log.at || log.created_at || log.createdAt || "",
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isLecturer = user?.role === ROLES.LECTURER;

  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalGroups: 0,
    allocatedGroups: 0,
    allocationPct: 0,
    activeLecturers: 0,
  });
  const [systemLogs, setSystemLogs] = useState([]);

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  const loadStudentDashboard = async () => {
    const [taskData, activityData] = await Promise.all([
      jiraTaskService.list(),
      githubActivityService.list(),
    ]);

    setTasks((Array.isArray(taskData) ? taskData : []).map(normalizeJiraTask));
    setActivities(Array.isArray(activityData) ? activityData : []);
  };

  const loadAdminDashboard = async () => {
    const [semesters, groups, lecturers, logs] = await Promise.all([
      semesterService.list().catch(() => []),
      groupService.list().catch(() => []),
      lecturerService.list().catch(() => []),
      syncLogService.list().catch(() => []),
    ]);

    const semesterList = Array.isArray(semesters) ? semesters : [];
    const allGroups = Array.isArray(groups) ? groups : [];
    const lecturerList = Array.isArray(lecturers) ? lecturers : [];
    const logList = Array.isArray(logs) ? logs : [];

    const activeSemester = semesterList.find(
      (s) => String(s.status || "").toLowerCase() === "active",
    );

    const activeGroups = activeSemester
      ? allGroups.filter((g) => (g.semester_id ?? g.semesterId) === activeSemester.id)
      : allGroups;

    const allocatedGroups = activeGroups.filter((g) => {
      const projectId = g.project_id ?? g.projectId;
      return projectId !== null && projectId !== undefined;
    }).length;

    const activeLecturers = lecturerList.filter(
      (l) => String(l.status || "").toLowerCase() === "active",
    ).length;

    setAdminStats({
      totalGroups: activeGroups.length,
      allocatedGroups,
      allocationPct: activeGroups.length
        ? Math.round((allocatedGroups / activeGroups.length) * 100)
        : 0,
      activeLecturers,
    });

    setSystemLogs(logList.slice(0, 8).map(mapSystemLog));
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminDashboard().catch((e) => console.error("[AdminDashboard] load failed:", e));
    } else if (!isLecturer) {
      loadStudentDashboard().catch((e) => console.error("[Dashboard] load failed:", e));
    }
  }, [isAdmin, isLecturer]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.syncAll();
      await loadStudentDashboard();
    } catch (e) {
      console.error("[Dashboard] sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isAdmin) {
    return <AdminDashboardView adminStats={adminStats} systemLogs={systemLogs} />;
  }

  if (isLecturer) {
    return <LecturerDashboardView />;
  }

  return (
    <DashboardView
      stats={stats}
      activities={activities}
      tasks={tasks}
      onSync={handleSync}
      isSyncing={isSyncing}
    />
  );
}

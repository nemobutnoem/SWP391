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
import { studentService } from "../../services/students/student.service.js";
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
    const [taskData, activityData, memberData, studentData] = await Promise.all([
      jiraTaskService.list().catch(() => []),
      githubActivityService.list().catch(() => []),
      groupService.listMembers().catch(() => []),
      studentService.list().catch(() => []),
    ]);

    const members = Array.isArray(memberData) ? memberData : [];
    const students = Array.isArray(studentData) ? studentData : [];

    const toNumberOrNull = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const normalizeText = (v) =>
      v == null
        ? ""
        : String(v)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .trim()
            .toLowerCase();

    const mappedMembers = members.map((m) => {
      const student = students.find((s) => Number(s.id) === Number(m.student_id ?? m.studentId));
      let name = student?.student_code || student?.studentCode || m.student_code;
      if (!name) name = student?.full_name || student?.fullName || m.full_name || m.fullName;
      if (!name) name = `User ${m.student_id}`;

      const memberUserId = toNumberOrNull(student?.user_id ?? student?.userId ?? m.user_id ?? m.userId);
      const memberKeys = new Set();
      if (memberUserId != null) memberKeys.add(`uid:${memberUserId}`);
      
      const account = normalizeText(student?.account ?? m.account);
      if (account) memberKeys.add(`name:${account}`);
      
      const fullName = normalizeText(student?.full_name ?? student?.fullName ?? m.full_name ?? m.fullName);
      if (fullName) memberKeys.add(`name:${fullName}`);
      
      const studentCode = normalizeText(student?.student_code ?? student?.studentCode ?? m.student_code);
      if (studentCode) memberKeys.add(`name:${studentCode}`);
      
      const email = normalizeText(student?.email ?? m.email);
      const emailPrefix = email ? email.split("@")[0] : "";
      if (emailPrefix) memberKeys.add(`name:${emailPrefix}`);

      return {
        displayName: name,
        keys: memberKeys,
        studentCode,
        emailPrefix,
        account,
        githubUsername: student?.github_username || m.github_username,
      };
    });

    const tasks = (Array.isArray(taskData) ? taskData : []).map((t) => {
      const norm = normalizeJiraTask(t);
      const getTaskAssigneeKeys = (task) => {
        const keys = new Set();
        const assigneeUserId = toNumberOrNull(task.assigneeUserId ?? task.assignee_user_id ?? task._raw?.assignee_user_id);
        if (assigneeUserId != null && assigneeUserId > 0) keys.add(`uid:${assigneeUserId}`);
        const assigneeName = normalizeText(task.assigneeName ?? task.assignee_name ?? task._raw?.assignee_name ?? task._raw?.assigneeName);
        if (assigneeName) keys.add(`name:${assigneeName}`);
        return keys;
      };

      const taskKeys = getTaskAssigneeKeys(norm);

      let matchedName = norm.assigneeName;
      if (mappedMembers.length > 0 && taskKeys.size > 0 && norm.assigneeName !== "Unassigned") {
        let found = null;
        for (const mm of mappedMembers) {
          let isMatch = false;
          for (const mk of mm.keys) {
            if (taskKeys.has(mk)) {
              isMatch = true;
              break;
            }
          }
          if (!isMatch) {
            for (const tk of taskKeys) {
              if (mm.studentCode && tk.includes(mm.studentCode)) isMatch = true;
              else if (mm.emailPrefix && tk.includes(mm.emailPrefix)) isMatch = true;
              else if (mm.account && tk.includes(mm.account)) isMatch = true;
            }
          }

          if (isMatch) {
            found = mm.displayName;
            break;
          }
        }
        if (found) {
          matchedName = found;
        }
      }

      norm.assigneeName = matchedName;
      return norm;
    });

    const acts = (Array.isArray(activityData) ? activityData : []).map(a => {
      let displayName = a.github_username;
      if (a.github_username) {
        const found = mappedMembers.find(m => m.githubUsername === a.github_username);
        if (found) displayName = found.displayName;
      }
      return {
        ...a,
        displayName,
        github_username: displayName || a.github_username
      };
    });

    setTasks(tasks);
    setActivities(acts);
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

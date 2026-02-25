import React, { useEffect, useMemo, useState } from "react";
import { DashboardView } from "./DashboardView.jsx";
import { computeTaskStats } from "../../features/tasks/taskStats.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";

const DEFAULT_GROUP_ID = 1;

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
  const [groupId] = useState(DEFAULT_GROUP_ID);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await jiraTaskService.listByGroup(groupId);

        // DEBUG
        console.log("[Dashboard] groupId =", groupId);
        console.log("[Dashboard] listByGroup returned:", data);

        const list = (Array.isArray(data) ? data : []).map(normalizeJiraTask);
        if (alive) setTasks(list);
      } catch (e) {
        console.error("[Dashboard] Load tasks failed:", e);
        if (alive) setTasks([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupId]);

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  return <DashboardView stats={stats} />;
}
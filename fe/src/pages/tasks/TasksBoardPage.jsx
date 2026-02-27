import React, { useEffect, useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { effectiveStatus } from "../../features/tasks/taskStats.js";

import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { syncService } from "../../services/sync/sync.service.js";

function normalizeStatus(s) {
  const v = String(s ?? "").trim().toUpperCase();
  if (v === "TODO" || v === "TO DO" || v === "TO_DO") return "TODO";
  if (v === "IN_PROGRESS" || v === "IN PROGRESS" || v === "INPROGRESS")
    return "IN_PROGRESS";
  if (v === "IN_REVIEW" || v === "IN REVIEW" || v === "INREVIEW")
    return "IN_REVIEW";
  if (v === "DONE") return "DONE";
  return "TODO";
}

function normalizeJiraTask(t) {
  return {
    id: Number(t.id),
    title: t.title ?? t.summary ?? t.jira_issue_key ?? `Task #${t.id}`,
    dueDate: t.dueDate ?? t.due_date ?? "",
    assigneeName: t.assigneeName ?? t.assignee_name ?? t.assignee ?? "Unassigned",
    status: normalizeStatus(t.status),
    // giữ raw nếu cần debug
    _raw: t,
  };
}

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [tasks, setTasks] = useState([]);

  const load = async () => {
    const data = await jiraTaskService.list();
    const list = Array.isArray(data) ? data : [];
    setTasks(list.map(normalizeJiraTask));
  };

  useEffect(() => {
    load().catch((e) => console.error("[TasksBoard] load failed:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    // optimistic UI: update trước cho mượt
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(taskId) ? { ...t, status: newStatus } : t)),
    );

    try {
      await jiraTaskService.updateStatus(taskId, newStatus);
      await load(); // reload để chắc chắn đồng bộ với mockDb/api
    } catch (e) {
      console.error("[TasksBoard] updateStatus failed:", e);
      await load(); // rollback bằng cách reload
    }
  };

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [query, tasks]);

  const columns = useMemo(() => {
    const base = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      OVERDUE: [],
    };

    for (const t of filteredTasks) {
      const st = effectiveStatus(t);
      (base[st] ?? base.TODO).push(t);
    }
    return base;
  }, [filteredTasks]);

  const onSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.syncAll();
      await load();
    } catch (e) {
      console.error("[TasksBoard] sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TasksBoardView
      query={query}
      onQueryChange={setQuery}
      isSyncing={isSyncing}
      onSync={onSync}
      columns={columns}
      onStatusChange={handleStatusChange}
    />
  );
}
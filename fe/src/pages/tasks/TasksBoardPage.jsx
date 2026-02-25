import React, { useEffect, useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { getJiraTasks } from "../../services/mockDb.service.js";
import { effectiveStatus } from "../../features/tasks/taskStats.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { syncService } from "../../services/sync/sync.service.js";

const DEFAULT_GROUP_ID = 1;

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
    status: t.status ?? "TODO",
    _raw: t,
  };
}

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [localTasks, setLocalTasks] = useState(() => getJiraTasks());

  const handleStatusChange = (taskId, newStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  };

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tasks, setTasks] = useState([]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await jiraTaskService.listByGroup(groupId);

      // DEBUG (để biết vì sao trống)
      console.log("groupId =", groupId);
      console.log("jiraTaskService.listByGroup returned:", data);

      setTasks((Array.isArray(data) ? data : []).map(normalizeJiraTask));
    } catch (e) {
      console.error("Load tasks failed:", e);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localTasks;
    return localTasks.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [query, localTasks]);

  const columns = useMemo(() => {
    const base = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      OVERDUE: [],
    };

    for (const t of tasks) {
      const st = effectiveStatus(t);
      (base[st] ?? base.TODO).push(t);
    }
    return base;
  }, [filteredTasks]);

  const onSync = async () => {
    setIsSyncing(true);
    // Simulation of fetching fresh data
    try {
      await new Promise((r) => setTimeout(r, 800));
      setLocalTasks(getJiraTasks());
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TasksBoardView
      query={query}
      onQueryChange={setQuery}
      columns={columns}
      onStatusChange={handleStatusChange}
    />
  );
}

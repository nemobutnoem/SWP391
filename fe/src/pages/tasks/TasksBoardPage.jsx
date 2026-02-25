import React, { useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { getJiraTasks } from "../../services/mockDb.service.js";
import { effectiveStatus } from "../../features/tasks/taskStats.js";

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [localTasks, setLocalTasks] = useState(() => getJiraTasks());

  const handleStatusChange = (taskId, newStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  };

  const tasks = useMemo(() => {
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
  }, [tasks]);

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
      isSyncing={isSyncing}
      onSync={onSync}
      columns={columns}
      onStatusChange={handleStatusChange}
    />
  );
}

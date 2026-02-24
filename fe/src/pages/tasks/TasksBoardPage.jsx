import React, { useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { MOCK_TASKS } from "../../features/tasks/mock/mockTasks.js";
import { effectiveStatus } from "../../features/tasks/taskStats.js";

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_TASKS;
    return MOCK_TASKS.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [query]);

  const columns = useMemo(() => {
    const base = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      OVERDUE: [],
    };

    for (const t of tasks) {
      const st = effectiveStatus(t); // DONE không bị overdue
      (base[st] ?? base.TODO).push(t);
    }
    return base;
  }, [tasks]);

  const onSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
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
    />
  );
}
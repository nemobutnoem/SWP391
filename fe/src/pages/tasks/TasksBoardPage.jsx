import React, { useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";

const MOCK_TASKS = [
  { id: "1", title: "Task 1", dueDate: "2024-01-15", assigneeName: "John Smith", status: "TODO" },
  { id: "2", title: "Task 2", dueDate: "2024-01-18", assigneeName: "Emma Wilson", status: "TODO" },
  { id: "3", title: "Task 3", dueDate: "2024-01-22", assigneeName: "Mike Davis", status: "TODO" },
  { id: "4", title: "Task 4", dueDate: "20-01-2028", assigneeName: "Lisa Brown", status: "TODO" },

  { id: "5", title: "Task 5", dueDate: "2024-01-20", assigneeName: "Alex Chen", status: "IN_PROGRESS" },
  { id: "6", title: "Task 6", dueDate: "2024-01-23", assigneeName: "Anna Taylor", status: "IN_PROGRESS" },
  { id: "7", title: "Task 7", dueDate: "2024-01-27", assigneeName: "David Lee", status: "IN_PROGRESS" },

  { id: "8", title: "Task 8", dueDate: "2024-01-16", assigneeName: "Tom Miller", status: "IN_REVIEW" },
  { id: "9", title: "Task 9", dueDate: "2024-01-24", assigneeName: "Sarah Johnson", status: "IN_REVIEW" },

  { id: "10", title: "Task 10", dueDate: "2024-01-12", assigneeName: "John Smith", status: "DONE" },
  { id: "11", title: "Task 11", dueDate: "2024-01-14", assigneeName: "Emma Wilson", status: "DONE" },
  { id: "12", title: "Task 12", dueDate: "2024-01-17", assigneeName: "Mike Davis", status: "DONE" },
  { id: "13", title: "Task 13", dueDate: "2024-01-19", assigneeName: "Alex Chen", status: "DONE" },
  { id: "14", title: "Task 14", dueDate: "2024-01-21", assigneeName: "Anna Taylor", status: "DONE" },

  { id: "15", title: "Task 15", dueDate: "2024-01-10", assigneeName: "Lisa Brown", status: "OVERDUE" },
  { id: "16", title: "Task 16", dueDate: "2024-01-08", assigneeName: "David Lee", status: "OVERDUE" },
];

function isOverdue(dueDate) {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return d < today;
}

function normalizeStatus(task) {
  // Rule: DONE thì không bao giờ bị đưa sang OVERDUE
  const status = task.status || "TODO";
  if (status === "DONE") return "DONE";

  // If the task is past due and not done => OVERDUE
  if (isOverdue(task.dueDate)) return "OVERDUE";

  // Otherwise, keep original status
  return status;
}

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Later: replace this with tasks from BE/service
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
      const st = normalizeStatus(t);
      (base[st] ?? base.TODO).push(t);
    }
    return base;
  }, [tasks]);

  const onSync = async () => {
    // Later: call syncService.syncAll() or syncService.syncJiraAndGithub()
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
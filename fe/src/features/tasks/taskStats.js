export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// Rule: DONE không bao giờ overdue
export function effectiveStatus(task) {
  if (task?.status === "DONE") return "DONE";
  if (isOverdue(task?.dueDate)) return "OVERDUE";

  // No separate Review lane in UI; treat review as in progress.
  if (task?.status === "IN_REVIEW") return "IN_PROGRESS";

  return task?.status || "TODO";
}

export function computeTaskStats(tasks) {
  const counts = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    OVERDUE: 0,
    TOTAL: 0,
  };

  for (const t of tasks || []) {
    const st = effectiveStatus(t);
    counts[st] = (counts[st] || 0) + 1;
    counts.TOTAL += 1;
  }

  const done = counts.DONE || 0;
  const total = counts.TOTAL || 0;
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  return { counts, progressPct };
}
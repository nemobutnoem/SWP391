// Utility to calculate contribution percentage from a list of tasks
// Usage: import { calculateContribution } from './ContributionUtils';

/**
 * Calculate contribution percentage for each member based on story points.
 * @param {Array} tasks - List of tasks (must have assignee and story_points fields)
 * @param {Function} getAssignee - Function to extract assignee id/name from a task
 * @param {Function} getStoryPoints - Function to extract story points from a task
 * @returns {Array} Array of { assignee, sp, pct }
 */
export function calculateContribution(tasks, getAssignee, getStoryPoints) {
  const normalizeAssignee = (value) => {
    if (value == null) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : null;
    }
    const s = String(value).trim();
    if (!s) return null;
    const lower = s.toLowerCase();
    if (lower === "unassigned" || lower === "(unassigned)" || lower === "none" || lower === "null") return null;
    return s;
  };

  // Xây dựng map: parentKey -> [subtasks]
  const parentToSubtasks = {};
  const taskKeyToTask = {};
  for (const task of tasks) {
    const key = task.key || task.issueKey || task.id;
    if (key) taskKeyToTask[key] = task;
    const parentKey = task.parent_issue_key || task.parentIssueKey || task.parentKey;
    if (parentKey) {
      if (!parentToSubtasks[parentKey]) parentToSubtasks[parentKey] = [];
      parentToSubtasks[parentKey].push(task);
    }
  }

  // Xác định các task cha có subtask có SP
  const parentWithSubtaskSP = new Set();
  for (const [parentKey, subtasks] of Object.entries(parentToSubtasks)) {
    if (subtasks.some(st => Number(getStoryPoints(st)) > 0)) {
      parentWithSubtaskSP.add(parentKey);
    }
  }

  // Tính điểm cho từng assignee
  const memberSp = {};
  for (const task of tasks) {
    const key = task.key || task.issueKey || task.id;
    const parentKey = task.parent_issue_key || task.parentIssueKey || task.parentKey;
    const assignee = normalizeAssignee(getAssignee(task));
    const sp = Number(getStoryPoints(task));
    if (!assignee || !Number.isFinite(sp) || sp <= 0) continue;

    // Nếu là subtask: luôn tính SP cho assignee của subtask
    if (parentKey) {
      memberSp[assignee] = (memberSp[assignee] || 0) + sp;
      continue;
    }

    // Nếu là task cha có subtask có SP: bỏ qua SP của task cha
    if (parentWithSubtaskSP.has(key)) continue;

    // Nếu là task cha không có subtask có SP: tính SP cho assignee của task cha
    memberSp[assignee] = (memberSp[assignee] || 0) + sp;
  }
  const rows = Object.entries(memberSp)
    .map(([assignee, sp]) => ({ assignee, sp }))
    .sort((a, b) => b.sp - a.sp);
  const totalSp = rows.reduce((sum, row) => sum + row.sp, 0);
  return rows.map(row => ({
    ...row,
    pct: totalSp > 0 ? Number(((row.sp / totalSp) * 100).toFixed(1)) : 0
  }));
}

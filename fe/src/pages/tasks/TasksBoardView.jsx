import React from "react";
import styles from "./tasksBoard.module.css";

const COLUMN_META = [
  { key: "TODO", title: "Backlog" },
  { key: "IN_PROGRESS", title: "In Progress" },
  { key: "DONE", title: "Completed" },
  { key: "OVERDUE", title: "Overdue" },
];

function parseDateOnlyToMs(value) {
  // Jira `duedate` is typically yyyy-MM-dd (date-only). Parse as UTC midnight to avoid TZ drift.
  if (!value) return null;
  const s = String(value).trim();
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const ms = Date.UTC(y, mo - 1, d);
    return Number.isNaN(ms) ? null : ms;
  }
  const dt = new Date(s);
  const ms = dt.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatDueDate(value) {
  const ms = parseDateOnlyToMs(value);
  if (ms == null) return "-";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(ms));
  } catch {
    return String(value);
  }
}

function isOverdue(task, statusKey) {
  // Nếu task đã được đưa vào cột OVERDUE từ columns thì tone danger
  if (statusKey === "OVERDUE") return true;

  // Optional: nếu có dueDate và quá hạn thì cũng danger
  if (!task?.dueDate) return false;
  const ms = parseDateOnlyToMs(task.dueDate);
  if (ms == null) return false;
  return ms < Date.now();
}

function TaskCard({
  task,
  statusKey,
  assigneeOptions,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
}) {
  const overdue = isOverdue(task, statusKey);

	const [priorityDraft, setPriorityDraft] = React.useState(task.priority || "");

	React.useEffect(() => {
		setPriorityDraft(task.priority || "");
	}, [task.priority]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`${styles.card} ${overdue ? styles.cardDanger : ""}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className={styles.cardTitle}>{task.title}</div>
      <div className={styles.cardMeta}>
        <div className={styles.cardDue}>
          Due:{" "}
          <span className={overdue ? styles.dueDanger : ""}>
            {formatDueDate(task.dueDate)}
          </span>
        </div>

        <div className={styles.cardEditRow}>
          <input
            className={styles.inlineInput}
            type="date"
            value={task.dueDate || ""}
            onChange={(e) => onDueDateChange?.(task.id, e.target.value)}
            onDragStart={(e) => e.stopPropagation()}
          />
          <input
            className={styles.inlineInput}
            placeholder="Priority"
            value={priorityDraft}
            onChange={(e) => setPriorityDraft(e.target.value)}
            onBlur={(e) => onPriorityChange?.(task.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onPriorityChange?.(task.id, e.target.value);
            }}
            onDragStart={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.avatar} aria-hidden />
        <div className={styles.assignee}>
          <select
            className={styles.assigneeSelect}
            value={task.assigneeUserId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const uid = v === "" ? null : Number(v);
              onAssigneeChange?.(task.id, task.groupId, uid);
            }}
            onDragStart={(e) => e.stopPropagation()}
          >
            <option value="">Unassigned</option>
            {(assigneeOptions || []).map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  statusKey,
  tasks,
  onStatusChange,
  membersByGroupId,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
}) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e) => {
    // OVERDUE is a computed lane (based on due date), not a real status in Jira.
    // Keep it read-only: don't allow dropping tasks into it.
    if (statusKey === "OVERDUE") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e) => {
    if (statusKey === "OVERDUE") return;
    e.preventDefault();
    setIsOver(false);

    const taskIdString = e.dataTransfer.getData("taskId");
    if (!taskIdString) return;

    const taskId = parseInt(taskIdString, 10);
    onStatusChange?.(taskId, statusKey);
  };

  return (
    <div
      className={`${styles.col} ${isOver ? styles["col--active"] : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles["col-header"]}>
        <div className={styles["col-title"]}>
          <span
            className={`${styles["col-indicator"]} ${styles[`col-indicator--${statusKey}`]}`}
          />
          {title}
        </div>
        <div className={styles["col-count"]}>{tasks.length}</div>
      </div>

      <div className={styles["col-body"]}>
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            statusKey={statusKey}
            assigneeOptions={membersByGroupId?.[t.groupId] ?? []}
            onAssigneeChange={onAssigneeChange}
            onDueDateChange={onDueDateChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}

// FIX CHÍNH: thêm onStatusChange ở đây
export function TasksBoardView({
  query,
  onQueryChange,
  isSyncing,
  onSync,
  columns,
  onStatusChange,
  membersByGroupId,
  onAssigneeChange,
	onDueDateChange,
	onPriorityChange,
}) {
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>

        <button className={styles.syncBtn} onClick={onSync} disabled={isSyncing}>
          {isSyncing ? "Syncing..." : "Sync with Jira & GitHub"}
        </button>
      </div>

      <div className={styles.board}>
        {COLUMN_META.map((col) => (
          <Column
            key={col.key}
            title={col.title}
            statusKey={col.key}
            tasks={columns[col.key] ?? []}
            onStatusChange={onStatusChange}
            membersByGroupId={membersByGroupId}
            onAssigneeChange={onAssigneeChange}
			onDueDateChange={onDueDateChange}
			onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}
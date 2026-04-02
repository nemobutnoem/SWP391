import React from "react";
import styles from "./tasksBoard.module.css";

const UNMAPPED_ASSIGNEE_VALUE = "__jira_external__";

const normalizeLookup = (value) => String(value || "").trim().toLowerCase();

function resolveMappedAssignee(task, options) {
  const normalizedAssigneeId = Number(task?.assigneeUserId);
  if (!Number.isNaN(normalizedAssigneeId) && normalizedAssigneeId > 0) {
    const byUserId = (options || []).find((m) => Number(m.userId) === normalizedAssigneeId);
    if (byUserId) return byUserId;
  }

  const assigneeKey = normalizeLookup(task?.assigneeName);
  if (!assigneeKey || assigneeKey === "unassigned") return null;

  return (options || []).find((m) => {
    const aliases = [m.name, m.account, m.emailLocal, m.studentCode]
      .map(normalizeLookup)
      .filter(Boolean);
    return aliases.includes(assigneeKey);
  }) || null;
}

const COLUMN_META = [
  { key: "TODO", title: "Backlog" },
  { key: "IN_PROGRESS", title: "In Progress" },
  { key: "DONE", title: "Completed" },
  { key: "OVERDUE", title: "Overdue" },
];

function parseDateOnlyToMs(value) {
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
  if (statusKey === "OVERDUE") return true;
  if (!task?.dueDate) return false;
  const ms = parseDateOnlyToMs(task.dueDate);
  if (ms == null) return false;
  return ms < Date.now();
}

function TaskCard({
  task,
  statusKey,
  canEditTaskFields,
  assigneeOptions,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
  onTaskClick,
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

  const handleCardClick = (e) => {
    if (e.target.closest("select, input, button")) return;
    onTaskClick?.(task);
  };

  const matchedAssignee = resolveMappedAssignee(task, assigneeOptions || []);

  return (
    <div
      className={`${styles.card} ${overdue ? styles.cardDanger : ""}`}
      draggable
      onDragStart={handleDragStart}
      onClick={handleCardClick}
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
            disabled={!canEditTaskFields}
            onChange={(e) => onDueDateChange?.(task.id, e.target.value)}
            onDragStart={(e) => e.stopPropagation()}
          />
          <input
            className={styles.inlineInput}
            placeholder="Priority"
            value={priorityDraft}
            disabled={!canEditTaskFields}
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
          {(() => {
            const options = assigneeOptions || [];
            const fallbackName =
              task.assigneeName && task.assigneeName !== "Unassigned"
                ? task.assigneeName
                : null;
            const selectValue = matchedAssignee
              ? matchedAssignee.userId
              : fallbackName
                ? UNMAPPED_ASSIGNEE_VALUE
                : "";
            return (
              <select
                className={styles.assigneeSelect}
                value={selectValue}
                disabled={!canEditTaskFields}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === UNMAPPED_ASSIGNEE_VALUE) return;
                  const uid = v === "" ? null : Number(v);
                  onAssigneeChange?.(task.id, task.groupId, uid);
                }}
                onDragStart={(e) => e.stopPropagation()}
              >
                <option value="">Unassigned</option>
                {!matchedAssignee && fallbackName && (
                  <option value={UNMAPPED_ASSIGNEE_VALUE} disabled>
                    {fallbackName} (Jira)
                  </option>
                )}
                {options.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  statusKey,
  tasks,
  canEditTaskFields,
  onStatusChange,
  membersByGroupId,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
  onTaskClick,
}) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e) => {
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
            canEditTaskFields={canEditTaskFields}
            assigneeOptions={membersByGroupId?.[t.groupId] ?? []}
            onAssigneeChange={onAssigneeChange}
            onDueDateChange={onDueDateChange}
            onPriorityChange={onPriorityChange}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}

export function TasksBoardView({
  query,
  onQueryChange,
  showAssigneeFilter,
  assigneeFilterOptions,
  selectedAssigneeUserId,
  onSelectedAssigneeChange,
  showOnlyMine,
  onToggleShowOnlyMine,
  isSyncing,
  onSyncJira,
  columns,
  canEditTaskFields,
  onStatusChange,
  membersByGroupId,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
  onTaskClick,
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

        <div className={styles.topbarActions}>
          {showAssigneeFilter && (
            <select
              className={styles.filterSelect}
              value={selectedAssigneeUserId}
              onChange={(e) => onSelectedAssigneeChange?.(e.target.value)}
              aria-label="Filter tasks by assignee"
            >
              <option value="">All members</option>
              {(assigneeFilterOptions || []).map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className={`${styles.mineBtn} ${showOnlyMine ? styles.mineBtnActive : ""}`}
            onClick={onToggleShowOnlyMine}
          >
            {showOnlyMine ? "Showing My Tasks" : "My Tasks"}
          </button>

          <button
            className={`${styles.syncBtnJira} ${isSyncing ? styles.syncing : ""}`}
            onClick={onSyncJira}
            disabled={isSyncing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.53 2c0 0-4.46 4.51-4.46 9.87 0 5.46 4.46 10.13 4.46 10.13s4.46-4.67 4.46-10.13C16 6.51 11.53 2 11.53 2zM12 18.27c-3-3.6-3-7.53-3-7.53s0-3.93 3-7.53c3 3.6 3 7.53 3 7.53s0 3.93-3 7.53z" />
            </svg>
            {isSyncing ? "Syncing..." : "Sync Jira"}
          </button>
        </div>
      </div>

      <div className={styles.board}>
        {COLUMN_META.map((col) => (
          <Column
            key={col.key}
            title={col.title}
            statusKey={col.key}
            tasks={columns[col.key] ?? []}
            canEditTaskFields={canEditTaskFields}
            onStatusChange={onStatusChange}
            membersByGroupId={membersByGroupId}
            onAssigneeChange={onAssigneeChange}
            onDueDateChange={onDueDateChange}
            onPriorityChange={onPriorityChange}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}

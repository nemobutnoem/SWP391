import React from "react";
import styles from "./tasksBoard.module.css";

const COLUMN_META = [
  { key: "TODO", title: "To Do", theme: "blue" },
  { key: "IN_PROGRESS", title: "In Progress", theme: "blue" },
  { key: "IN_REVIEW", title: "In Review", theme: "blue" },
  { key: "DONE", title: "Done", theme: "blue" },
  { key: "OVERDUE", title: "Overdue", theme: "red" },
];

function TaskCard({ task, tone = "normal" }) {
  return (
    <div className={`${styles.card} ${tone === "danger" ? styles.cardDanger : ""}`}>
      <div className={styles.cardTitle}>{task.title}</div>

      <div className={styles.cardMeta}>
        <div className={styles.cardDue}>
          Due:{" "}
          <span className={tone === "danger" ? styles.dueDanger : ""}>
            {task.dueDate || "-"}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.avatar} aria-hidden />
        <div className={styles.assignee}>{task.assigneeName || "Unassigned"}</div>
      </div>
    </div>
  );
}

function Column({ title, theme, tasks }) {
  const isRed = theme === "red";
  return (
    <div className={styles.col}>
      <div className={`${styles.colHeader} ${isRed ? styles.colHeaderRed : styles.colHeaderBlue}`}>
        <div className={styles.colTitle}>{title}</div>
        <div className={styles.colCount}>{tasks.length} tasks</div>
      </div>

      <div className={styles.colBody}>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} tone={isRed ? "danger" : "normal"} />
        ))}
      </div>
    </div>
  );
}

export function TasksBoardView({
  query,
  onQueryChange,
  isSyncing,
  onSync,
  columns,
  isLoading = false,
}) {
  const busy = isLoading || isSyncing;

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={isLoading ? "Loading tasks..." : "Search tasks..."}
            disabled={busy}
          />
        </div>

        <button className={styles.syncBtn} onClick={onSync} disabled={busy}>
          {isSyncing ? "Syncing..." : "Sync with Jira & GitHub"}
        </button>

        <div className={styles.statusText}>
          {isLoading ? "Loading..." : isSyncing ? "Syncing..." : ""}
        </div>
      </div>

      <div className={styles.board}>
        {COLUMN_META.map((c) => (
          <Column key={c.key} title={c.title} theme={c.theme} tasks={columns[c.key] ?? []} />
        ))}
      </div>
    </div>
  );
}
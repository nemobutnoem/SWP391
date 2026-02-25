import React from "react";
import styles from "./tasksBoard.module.css";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { PriorityIcon } from "../../components/common/StatusComponents.jsx";

const COLUMN_META = [
  { key: "TODO", title: "Backlog" },
  { key: "IN_PROGRESS", title: "In Progress" },
  { key: "IN_REVIEW", title: "Review" },
  { key: "DONE", title: "Completed" },
  { key: "OVERDUE", title: "Overdue" },
];

function TaskCard({ task, statusKey, onStatusChange }) {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isSynced, setIsSynced] = React.useState(true);

  const initials =
    task.assigneeName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const handlePush = (e) => {
    e.stopPropagation();
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsSynced(true);
    }, 1200);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={`${styles.card} ${tone === "danger" ? styles.cardDanger : ""}`}>
      <div className={styles.cardTitle}>{task.title}</div>
      <div className={styles.cardMeta}>
        <div className={styles.cardDue}>
          Due: <span className={tone === "danger" ? styles.dueDanger : ""}>{task.dueDate}</span>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.avatar} aria-hidden />
        <div className={styles.assignee}>{task.assigneeName}</div>
      </div>
    </div>
  );
}

function Column({ title, statusKey, tasks, onStatusChange }) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const taskIdString = e.dataTransfer.getData("taskId");
    if (taskIdString) {
      const taskId = parseInt(taskIdString);
      onStatusChange(taskId, statusKey === "OVERDUE" ? "TODO" : statusKey);
    }
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
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

export function TasksBoardView({ query, onQueryChange, isSyncing, onSync, columns }) {
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
          />
        ))}
      </div>
    </div>
  );
}

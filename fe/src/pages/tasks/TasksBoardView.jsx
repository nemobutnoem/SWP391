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
    <div
      className={`${styles.card} ${styles[`card--${statusKey}`]}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className={styles["card-header"]}>
        <div className={styles["card-key-wrap"]}>
          <span className={styles["card-key"]}>{task.jira_issue_key}</span>
          {isSynced && (
            <div className={styles["sync-dot"]} title="Synced with Jira" />
          )}
        </div>
        <div className={styles["card-actions"]}>
          <button
            className={styles["btn-mini"]}
            title="Push status update to Jira"
            onClick={handlePush}
            disabled={isSyncing}
          >
            {isSyncing ? "..." : "↑ Jira"}
          </button>
          <PriorityIcon priority={task.priority} />
        </div>
      </div>
      <div className={styles["card-title"]}>{task.title}</div>
      <div className={styles["card-footer"]}>
        <div className={styles["card-assignee"]}>
          <div className={styles["card-avatar"]}>{initials}</div>
          <span className={styles["card-name"]}>{task.assigneeName}</span>
        </div>
        <div className={styles["status-wrap"]}>
          <select
            className={styles["status-select"]}
            value={statusKey === "OVERDUE" ? "TODO" : statusKey}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
          >
            <option value="TODO">Backlog</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">Review</option>
            <option value="DONE">Completed</option>
          </select>
        </div>
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

export function TasksBoardView({
  query,
  onQueryChange,
  isSyncing,
  onSync,
  columns,
  onStatusChange,
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Working Board"
        description="Track and manage group tasks. Drag and drop cards to change status or use quick controls."
        actions={
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className={styles["search-wrap"]}>
              <span className={styles["search-icon"]}>🔍</span>
              <input
                className={styles["search-input"]}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>
            <Button
              variant="primary"
              onClick={onSync}
              disabled={isSyncing}
              icon={isSyncing ? "⏳" : "🔄"}
            >
              {isSyncing ? "Synchronizing..." : "Sync Jira"}
            </Button>
          </div>
        }
      />

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

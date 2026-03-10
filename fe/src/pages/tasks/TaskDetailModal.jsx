import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./taskDetailModal.module.css";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function priorityColor(p) {
  const v = String(p ?? "").toLowerCase();
  if (v === "highest" || v === "critical") return "#d32f2f";
  if (v === "high") return "#e65100";
  if (v === "medium") return "#f9a825";
  if (v === "low") return "#2e7d32";
  if (v === "lowest") return "#66bb6a";
  return "#64748b";
}

function statusBadgeClass(status) {
  const v = String(status ?? "")
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (v === "DONE") return styles.badgeDone;
  if (v === "IN_PROGRESS" || v === "IN_REVIEW") return styles.badgeInProgress;
  return styles.badgeTodo;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  comments,
  onAddComment,
  isLoadingComments,
  assigneeOptions,
  onStatusChange,
  onAssigneeChange,
  onDueDateChange,
  onPriorityChange,
}) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setNewComment("");
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const raw = task._raw || {};
  const issueKey = raw.jira_issue_key || raw.jiraIssueKey || "";
  const description = raw.description || "";
  const issueType = raw.issue_type || raw.issueType || "";

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(task.id, text);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {issueKey && <span className={styles.issueKey}>{issueKey}</span>}
            {issueType && <span className={styles.issueType}>{issueType}</span>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Content two-column layout */}
        <div className={styles.body}>
          {/* Left: main content */}
          <div className={styles.mainCol}>
            <h2 className={styles.title}>{task.title}</h2>

            {description && (
              <div className={styles.section}>
                <h4 className={styles.sectionLabel}>Description</h4>
                <p className={styles.description}>{description}</p>
              </div>
            )}

            {/* Comments */}
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>
                Comments{" "}
                {comments.length > 0 && (
                  <span className={styles.commentCount}>{comments.length}</span>
                )}
              </h4>

              <form className={styles.commentForm} onSubmit={handleSubmitComment}>
                <textarea
                  className={styles.commentInput}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className={styles.commentFormActions}>
                  <button
                    type="submit"
                    className={styles.commentSubmit}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>

              {isLoadingComments && (
                <p className={styles.loadingText}>Loading comments...</p>
              )}

              <div className={styles.commentList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.commentItem}>
                    <div className={styles.commentAvatar}>
                      {getInitials(c.userName)}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {c.userName || "Unknown"}
                        </span>
                        <span className={styles.commentTime}>
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className={styles.commentText}>{c.content}</p>
                    </div>
                  </div>
                ))}
                {!isLoadingComments && comments.length === 0 && (
                  <p className={styles.noComments}>No comments yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: details sidebar */}
          <div className={styles.sideCol}>
            {/* Status */}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <select
                className={`${styles.detailSelect} ${statusBadgeClass(task.status)}`}
                value={task.status}
                onChange={(e) => onStatusChange?.(task.id, e.target.value)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Assignee */}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Assignee</span>
              <select
                className={styles.detailSelect}
                value={task.assigneeUserId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const uid = v === "" ? null : Number(v);
                  onAssigneeChange?.(task.id, task.groupId, uid);
                }}
              >
                <option value="">Unassigned</option>
                {(assigneeOptions || []).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Priority</span>
              <div className={styles.priorityWrap}>
                <span
                  className={styles.priorityDot}
                  style={{ background: priorityColor(task.priority) }}
                />
                <input
                  className={styles.detailInput}
                  value={task.priority || ""}
                  placeholder="None"
                  onChange={() => {}}
                  onBlur={(e) => onPriorityChange?.(task.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      onPriorityChange?.(task.id, e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Due Date */}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Due Date</span>
              <input
                type="date"
                className={styles.detailInput}
                value={task.dueDate || ""}
                onChange={(e) => onDueDateChange?.(task.id, e.target.value)}
              />
            </div>

            {/* Created */}
            {raw.jira_created_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Created</span>
                <span className={styles.detailValue}>
                  {formatDate(raw.jira_created_at)}
                </span>
              </div>
            )}

            {/* Updated */}
            {raw.jira_updated_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Updated</span>
                <span className={styles.detailValue}>
                  {formatDate(raw.jira_updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

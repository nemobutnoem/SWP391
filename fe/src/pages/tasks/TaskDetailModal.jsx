import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./taskDetailModal.module.css";

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

function formatDate(value) {
  if (!value) return "-";
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
  canEditTaskFields,
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
  const reporterName = raw.reporterName || raw.reporter_name || "";
  const parentIssueKey = raw.parent_issue_key || raw.parentIssueKey || "";
  const labels = raw.labels || "";
  const sprintName = raw.sprint_name || raw.sprintName || "";
  const storyPoints = raw.story_points ?? raw.storyPoints ?? null;
  const jiraCreatedAt = raw.jira_created_at || raw.jiraCreatedAt || "";
  const jiraUpdatedAt = raw.jira_updated_at || raw.jiraUpdatedAt || "";
  const matchedAssignee = resolveMappedAssignee(task, assigneeOptions || []);

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
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {issueKey && <span className={styles.issueKey}>{issueKey}</span>}
            {issueType && <span className={styles.issueType}>{issueType}</span>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.mainCol}>
            <h2 className={styles.title}>{task.title}</h2>

            {description && (
              <div className={styles.section}>
                <h4 className={styles.sectionLabel}>Description</h4>
                <p className={styles.description}>{description}</p>
              </div>
            )}

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

          <div className={styles.sideCol}>
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

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Assignee</span>
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
                    className={styles.detailSelect}
                    value={selectValue}
                    disabled={!canEditTaskFields}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === UNMAPPED_ASSIGNEE_VALUE) return;
                      const uid = v === "" ? null : Number(v);
                      onAssigneeChange?.(task.id, task.groupId, uid);
                    }}
                  >
                    <option value="">Unassigned</option>
                    {!matchedAssignee && fallbackName && (
                      <option value={UNMAPPED_ASSIGNEE_VALUE} disabled>
                        {fallbackName} (Jira)
                      </option>
                    )}
                    {(assigneeOptions || []).map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>

            {reporterName && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reporter</span>
                <span className={styles.detailValue}>
                  <span className={styles.inlineAvatar}>{getInitials(reporterName)}</span>
                  {reporterName}
                </span>
              </div>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Priority</span>
              <div className={styles.priorityWrap}>
                <span
                  className={styles.priorityDot}
                  style={{ background: priorityColor(task.priority) }}
                />
                <select
                  className={styles.detailSelect}
                  value={task.priority || ""}
                  disabled={!canEditTaskFields}
                  onChange={(e) => onPriorityChange?.(task.id, e.target.value)}
                >
                  <option value="">None</option>
                  <option value="Highest">Highest</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Lowest">Lowest</option>
                </select>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Due Date</span>
              <input
                type="date"
                className={styles.detailInput}
                value={task.dueDate || ""}
                disabled={!canEditTaskFields}
                onChange={(e) => onDueDateChange?.(task.id, e.target.value)}
              />
            </div>

            {sprintName && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Sprint</span>
                <span className={styles.detailValue}>
                  <span className={styles.sprintBadge}>{sprintName}</span>
                </span>
              </div>
            )}

            {storyPoints != null && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Story Points</span>
                <span className={styles.detailValue}>
                  <span className={styles.storyPointBadge}>{storyPoints}</span>
                </span>
              </div>
            )}

            {labels && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Labels</span>
                <div className={styles.labelsList}>
                  {labels.split(",").map((l, i) => (
                    <span key={i} className={styles.labelBadge}>{l.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {parentIssueKey && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Parent</span>
                <span className={styles.detailValue}>
                  <span className={styles.parentKeyBadge}>{parentIssueKey}</span>
                </span>
              </div>
            )}

            {jiraCreatedAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Created</span>
                <span className={styles.detailValue}>
                  {formatDate(jiraCreatedAt)}
                </span>
              </div>
            )}

            {jiraUpdatedAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Updated</span>
                <span className={styles.detailValue}>
                  {formatDate(jiraUpdatedAt)}
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

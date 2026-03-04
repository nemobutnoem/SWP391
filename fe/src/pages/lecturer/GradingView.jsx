import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import "../admin/adminManagement.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function GradingView({
  filteredGrades,
  allGroups,
  filterStatus,
  onFilterStatusChange,
  editingId,
  draftScore,
  draftFeedback,
  onDraftScoreChange,
  onDraftFeedbackChange,
  onOpenEdit,
  onSaveGrade,
  onCancelEdit,
  stats,
}) {
  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="Grading & Reviews"
        description="Review submitted milestones and provide scores with constructive feedback for your groups."
      />

      {/* Mini stats */}
      <div className="allocation-stats mt-2" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card-mini">
          <span className="mini-label">Total Submissions</span>
          <span className="mini-value">{stats.total}</span>
        </div>
        <div className="stat-card-mini">
          <span className="mini-label">Graded</span>
          <span className="mini-value" style={{ color: "var(--success-600)" }}>
            {stats.graded}
          </span>
        </div>
        <div className="stat-card-mini">
          <span className="mini-label">Pending</span>
          <span className="mini-value" style={{ color: "var(--warning-600)" }}>
            {stats.pending}
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-controls">
          {["ALL", "PENDING", "GRADED"].map((s) => (
            <button
              key={s}
              className={`tab-item ${filterStatus === s ? "tab-item--active" : ""}`}
              style={{ cursor: "pointer", border: "none", background: "none" }}
              onClick={() => onFilterStatusChange(s)}
            >
              {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : "Graded"}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Milestone</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Score / 10</th>
              <th>Feedback</th>
              <th className="action-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.map((gr) => {
              const group = allGroups.find((g) => g.id === gr.group_id);
              const isEditing = editingId === gr.id;

              return (
                <tr key={gr.id}>
                  <td>
                    <span className="profile-name">{group?.group_name}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{gr.milestone}</span>
                  </td>
                  <td>
                    <span className="text-secondary">{gr.date}</span>
                  </td>
                  <td>
                    <Badge
                      variant={gr.status === "GRADED" ? "success" : "warning"}
                      size="sm"
                    >
                      {gr.status}
                    </Badge>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={draftScore}
                        onChange={(e) => onDraftScoreChange(e.target.value)}
                        style={{
                          width: "70px",
                          padding: "0.375rem 0.5rem",
                          border: "1px solid var(--brand-400)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <strong
                        style={{
                          color:
                            gr.score !== null
                              ? "var(--brand-700)"
                              : "var(--slate-400)",
                        }}
                      >
                        {gr.score !== null ? `${gr.score} / 10` : "—"}
                      </strong>
                    )}
                  </td>
                  <td style={{ maxWidth: "220px" }}>
                    {isEditing ? (
                      <textarea
                        value={draftFeedback}
                        onChange={(e) => onDraftFeedbackChange(e.target.value)}
                        placeholder="Write feedback..."
                        style={{
                          width: "100%",
                          padding: "0.375rem 0.5rem",
                          border: "1px solid var(--brand-400)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.8125rem",
                          resize: "vertical",
                          minHeight: "60px",
                        }}
                      />
                    ) : (
                      <span
                        className="text-secondary"
                        style={{ fontSize: "0.8125rem" }}
                      >
                        {gr.feedback ?? "No feedback yet"}
                      </span>
                    )}
                  </td>
                  <td className="action-cell">
                    <div className="action-buttons">
                      {isEditing ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onSaveGrade(gr.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenEdit(gr)}
                        >
                          {gr.status === "GRADED" ? "Edit" : "Grade"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

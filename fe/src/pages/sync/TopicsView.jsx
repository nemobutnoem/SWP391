import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { TopicFormModal } from "./TopicFormModal.jsx";
import "./topics.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function TopicsView({
  topics,
  semesters,
  selectedSemesterId,
  onSelectedSemesterIdChange,
  blockFilter,
  onBlockFilterChange,
  isCrudLocked,
  isCreateLocked,
  lockBlockTypeTo,
  defaultBlockType,
  isModalOpen,
  editingTopic,
  onOpenCreate,
  onOpenEdit,
  onCloseModal,
  onSubmit,
  onArchive,
  onDelete,
}) {
  const semesterOptions = Array.isArray(semesters) ? [...semesters] : [];
  semesterOptions.sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));

  return (
    <div className="topics-page">
      <PageHeader
        title="Project Topics"
        description="Administrative management of project topics. Assign, activate, or archive topics for upcoming semesters."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreate}
            disabled={Boolean(isCrudLocked) || Boolean(isCreateLocked)}
            title={
              Boolean(isCrudLocked)
                ? "Completed semester is view-only"
                : Boolean(isCreateLocked)
                  ? "You can only create topics for UPCOMING semesters"
                  : undefined
            }
          >
            Create Topic
          </Button>
        }
      />

      <div className="filter-bar" style={{ marginBottom: "1rem" }}>
        <div className="filter-controls">
          <select className="filter-select" value={selectedSemesterId} onChange={(e) => onSelectedSemesterIdChange(e.target.value)}>
            {semesterOptions.map((sem) => (
              <option key={sem.id} value={String(sem.id)}>
                {sem.name || `Semester ${sem.id}`}
              </option>
            ))}
          </select>

          <select className="filter-select" value={blockFilter} onChange={(e) => onBlockFilterChange(e.target.value)}>
            <option value="ALL">All Blocks</option>
            <option value="MAIN">10 weeks (Main)</option>
            <option value="CAPSTONE">3 weeks (Capstone)</option>
          </select>
        </div>
      </div>

      <TopicFormModal
        key={editingTopic ? `edit-${editingTopic.id}` : `create-${selectedSemesterId}-${defaultBlockType}`}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        initialData={editingTopic}
        defaultBlockType={defaultBlockType}
        lockBlockTypeTo={lockBlockTypeTo}
        disabled={Boolean(isCrudLocked)}
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
      />

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Topic Details</th>
              <th>Block</th>
              <th>Description</th>
              <th>Status</th>
              <th className="action-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id}>
                <td>
                  <span className="topic-name">{topic.name}</span>
                  <span className="topic-code">Code: {topic.code}</span>
                </td>
                <td>
                  <Badge variant={String(topic.block_type ?? topic.blockType ?? "MAIN").toUpperCase() === "CAPSTONE" ? "warning" : "info"} size="sm">
                    {String(topic.block_type ?? topic.blockType ?? "MAIN").toUpperCase() === "CAPSTONE" ? "3w" : "10w"}
                  </Badge>
                </td>
                <td>
                  <div className="topic-desc" title={topic.description}>
                    {topic.description}
                  </div>
                </td>
                <td>
                  {(() => {
                    const status = String(topic.status || "").toUpperCase();
                    const variant =
                      status === "ACTIVE"
                        ? "success"
                        : status === "ARCHIVED"
                          ? "neutral"
                          : "warning";
                    return (
                  <Badge
                    variant={variant}
                    size="sm"
                  >
                    {status || "UNKNOWN"}
                  </Badge>
                    );
                  })()}
                </td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEdit(topic)}
                      disabled={Boolean(isCrudLocked)}
                      title={Boolean(isCrudLocked) ? "Completed semester is view-only" : undefined}
                    >
                      Edit
                    </Button>
                    {topic.status !== "ARCHIVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(topic.id)}
                        disabled={Boolean(isCrudLocked)}
                        title={Boolean(isCrudLocked) ? "Completed semester is view-only" : undefined}
                      >
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-delete"
                      onClick={() => onDelete(topic)}
                      disabled={Boolean(isCrudLocked)}
                      title={Boolean(isCrudLocked) ? "Completed semester is view-only" : undefined}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

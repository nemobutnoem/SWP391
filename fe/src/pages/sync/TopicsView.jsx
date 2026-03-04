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
  isModalOpen,
  editingTopic,
  onOpenCreate,
  onOpenEdit,
  onCloseModal,
  onSubmit,
  onArchive,
}) {
  return (
    <div className="topics-page">
      <PageHeader
        title="Project Topics"
        description="Administrative management of project topics. Assign, activate, or archive topics for upcoming semesters."
        actions={
          <Button variant="primary" size="sm" onClick={onOpenCreate}>
            Create Topic
          </Button>
        }
      />

      <TopicFormModal
        key={editingTopic ? `edit-${editingTopic.id}` : "create"}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        initialData={editingTopic}
      />

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Topic Details</th>
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
                  <div className="topic-desc" title={topic.description}>
                    {topic.description}
                  </div>
                </td>
                <td>
                  <Badge
                    variant={
                      topic.status === "ACTIVE"
                        ? "success"
                        : topic.status === "ARCHIVED"
                          ? "neutral"
                          : "warning"
                    }
                    size="sm"
                  >
                    {topic.status}
                  </Badge>
                </td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEdit(topic)}
                    >
                      Edit
                    </Button>
                    {topic.status !== "ARCHIVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(topic.id)}
                      >
                        Archive
                      </Button>
                    )}
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

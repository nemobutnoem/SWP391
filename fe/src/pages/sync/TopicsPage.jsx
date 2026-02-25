import React, { useState } from "react";
import { getTopics } from "../../services/mockDb.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { TopicFormModal } from "./TopicFormModal.jsx";
import "./topics.css";

export function TopicsPage() {
  const [topics, setTopics] = useState(() => getTopics());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic) => {
    setEditingTopic(topic);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData) => {
    if (editingTopic) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === editingTopic.id ? { ...formData, id: t.id } : t,
        ),
      );
    } else {
      const newTopic = {
        ...formData,
        id: Date.now(),
      };
      setTopics((prev) => [newTopic, ...prev]);
    }
  };

  const handleArchive = (id) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "ARCHIVED" } : t)),
    );
  };

  return (
    <div className="topics-page">
      <PageHeader
        title="Project Topics"
        description="Administrative management of project topics. Assign, activate, or archive topics for upcoming semesters."
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            Create Topic
          </Button>
        }
      />

      <TopicFormModal
        key={editingTopic ? `edit-${editingTopic.id}` : "create"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
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
                      onClick={() => handleOpenEdit(topic)}
                    >
                      Edit
                    </Button>
                    {topic.status !== "ARCHIVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(topic.id)}
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

import React, { useEffect, useState } from "react";
import { topicService } from "../../services/topics/topic.service.js";
import { TopicsView } from "./TopicsView.jsx";
import "./topics.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function TopicsPage() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    topicService.list().then(setTopics);
  }, []);
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
        prev.map((t) => t.id === editingTopic.id ? { ...formData, id: t.id } : t),
      );
    } else {
      setTopics((prev) => [{ ...formData, id: Date.now() }, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleArchive = (id) => {
    setTopics((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: "ARCHIVED" } : t),
    );
  };

  return (
    <TopicsView
      topics={topics}
      isModalOpen={isModalOpen}
      editingTopic={editingTopic}
      onOpenCreate={handleOpenCreate}
      onOpenEdit={handleOpenEdit}
      onCloseModal={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      onArchive={handleArchive}
    />
  );
}

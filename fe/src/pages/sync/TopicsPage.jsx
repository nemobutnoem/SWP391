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

  const handleSubmit = async (formData) => {
    try {
      if (editingTopic) {
        await topicService.update(editingTopic.id, formData);
      } else {
        await topicService.create(formData);
      }
      const updatedTopics = await topicService.list();
      setTopics(updatedTopics);
      setIsModalOpen(false);
    } catch (e) {
      alert("Error saving topic: " + (e.response?.data?.message || e.message));
    }
  };

  const handleArchive = async (id) => {
    try {
      if (window.confirm("Are you sure you want to archive this topic?")) {
        await topicService.archive(id);
        const updatedTopics = await topicService.list();
        setTopics(updatedTopics);
      }
    } catch (e) {
      alert("Failed to archive topic: " + (e.response?.data?.message || e.message));
    }
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

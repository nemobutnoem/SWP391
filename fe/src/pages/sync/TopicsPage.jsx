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

<<<<<<< Updated upstream
  const handleSubmit = (formData) => {
    if (editingTopic) {
      setTopics((prev) =>
        prev.map((t) => t.id === editingTopic.id ? { ...formData, id: t.id } : t),
      );
    } else {
      setTopics((prev) => [{ ...formData, id: Date.now() }, ...prev]);
    }
    setIsModalOpen(false);
=======
  // Chỉ thực hiện API call + refresh list. Không đóng modal ở đây.
  // Modal tự quyết định đóng (thành công) hay ở lại hiển thị lỗi (thất bại).
  const handleSubmit = async (formData) => {
    if (editingTopic) {
      await topicService.update(editingTopic.id, formData);
    } else {
      await topicService.create(formData);
    }
    // Chỉ refresh list khi API thành công (nếu fail sẽ throw và không chạy đến đây)
    topicService.list().then(setTopics);
>>>>>>> Stashed changes
  };

  const handleArchive = (id) => {
    setTopics((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: "ARCHIVED" } : t),
    );
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to permanently delete this topic? This action cannot be undone.")) {
        await topicService.delete(id);
        const updatedTopics = await topicService.list();
        setTopics(updatedTopics);
      }
    } catch (e) {
      alert("Failed to delete topic: " + (e.response?.data?.message || e.message));
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
      onDelete={handleDelete}
    />
  );
}

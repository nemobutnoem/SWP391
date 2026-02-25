import React, { useMemo, useState } from "react";
import { getJiraTasks } from "../../services/mockDb.service.js";
import { SRSBuilderView } from "./SRSBuilderView.jsx";
import "./srsBuilder.css";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
export function SRSBuilderPage() {
  const [viewMode, setViewMode] = useState("builder");
  const [tasks, setTasks] = useState(() =>
    getJiraTasks().map((t) => ({ ...t, category: "UNMAPPED" })),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleMoveTask = (taskId, newCategory) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, category: newCategory } : t)),
    );
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(
        "SRS Báo cáo đã được xuất thành công! Tập tin PDF đang được chuẩn bị tải xuống.",
      );
    }, 2000);
  };

  const groupedTasks = useMemo(() => {
    const groups = { UNMAPPED: [], FUNCTIONAL: [], NON_FUNCTIONAL: [], CONSTRAINT: [] };
    tasks.forEach((t) => groups[t.category].push(t));
    return groups;
  }, [tasks]);

  return (
    <SRSBuilderView
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      groupedTasks={groupedTasks}
      isGenerating={isGenerating}
      lastSaved={lastSaved}
      onMoveTask={handleMoveTask}
      onGenerate={handleGenerate}
      onDrop={handleMoveTask}
    />
  );
}

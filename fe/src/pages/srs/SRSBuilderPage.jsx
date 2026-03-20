import React, { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { SRSBuilderView } from "./SRSBuilderView.jsx";
import "./srsBuilder.css";

export function SRSBuilderPage() {
  const [viewMode, setViewMode] = useState("builder");
  const [tasks, setTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const previewRef = useRef(null);

  // Group filter
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    groupService.list().then((data) => {
      setGroups(data);
      if (data.length > 0) setSelectedGroupId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    jiraTaskService.listByGroup(selectedGroupId).then((data) => {
      setTasks(
        data.map((t) => ({
          ...t,
          category: t.srs_category || "UNMAPPED",
        })),
      );
    });
  }, [selectedGroupId]);

  const handleMoveTask = async (taskId, newCategory) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, category: newCategory } : t)),
    );
    try {
      await jiraTaskService.updateSrsCategory(taskId, newCategory === "UNMAPPED" ? null : newCategory);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to save SRS category:", e);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setViewMode("preview");
    // Wait for preview to render, then capture as PDF
    setTimeout(() => {
      const element = previewRef.current;
      if (!element) {
        setIsGenerating(false);
        return;
      }
      const opt = {
        margin: [10, 10, 10, 10],
        filename: "SRS_Report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save().then(() => {
        setIsGenerating(false);
      }).catch(() => {
        setIsGenerating(false);
      });
    }, 600);
  };

  const groupedTasks = useMemo(() => {
    const groups = { UNMAPPED: [], FUNCTIONAL: [], NON_FUNCTIONAL: [], CONSTRAINT: [] };
    tasks.forEach((t) => {
      const cat = groups[t.category] ? t.category : "UNMAPPED";
      groups[cat].push(t);
    });
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
      groups={groups}
      selectedGroupId={selectedGroupId}
      onGroupChange={setSelectedGroupId}
      previewRef={previewRef}
    />
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { GradingView } from "./GradingView.jsx";
import "../admin/adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function GradingPage() {
  const [allGroups, setAllGroups] = useState([]);
  const [grades, setGrades] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draftScore, setDraftScore] = useState("");
  const [draftFeedback, setDraftFeedback] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    groupService.list().then(setAllGroups);
    gradeService.list().then(setGrades);
  }, []);

  // BE already filters grades by role (lecturer sees only own grades)
  const myGrades = grades;

  const filteredGrades = useMemo(() => {
    if (filterStatus === "ALL") return myGrades;
    return myGrades.filter((g) => g.status === filterStatus);
  }, [myGrades, filterStatus]);

  const openEdit = (gr) => {
    setEditingId(gr.id);
    setDraftScore(gr.score ?? "");
    setDraftFeedback(gr.feedback ?? "");
  };

  const saveGrade = async (id) => {
    const score = parseFloat(draftScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert("Score must be between 0 and 10.");
      return;
    }
    try {
      const updated = await gradeService.save(id, { score, feedback: draftFeedback, status: "GRADED" });
      setGrades((prev) =>
        prev.map((g) => (g.id === id ? updated : g)),
      );
    } catch (err) {
      alert("Failed to save grade: " + (err.message || err));
    }
    setEditingId(null);
  };

  const createMilestone = async ({ group_id, milestone, date }) => {
    try {
      const created = await gradeService.create({ group_id, milestone, date });
      setGrades((prev) => [...prev, created]);
      setShowCreateModal(false);
    } catch (err) {
      alert("Failed to create milestone: " + (err.message || err));
    }
  };

  const stats = {
    total: myGrades.length,
    pending: myGrades.filter((g) => g.status === "PENDING").length,
    graded: myGrades.filter((g) => g.status === "GRADED").length,
  };

  return (
    <GradingView
      filteredGrades={filteredGrades}
      allGroups={allGroups}
      filterStatus={filterStatus}
      onFilterStatusChange={setFilterStatus}
      editingId={editingId}
      draftScore={draftScore}
      draftFeedback={draftFeedback}
      onDraftScoreChange={setDraftScore}
      onDraftFeedbackChange={setDraftFeedback}
      onOpenEdit={openEdit}
      onSaveGrade={saveGrade}
      onCancelEdit={() => setEditingId(null)}
      stats={stats}
      showCreateModal={showCreateModal}
      onOpenCreateModal={() => setShowCreateModal(true)}
      onCloseCreateModal={() => setShowCreateModal(false)}
      onCreateMilestone={createMilestone}
    />
  );
}

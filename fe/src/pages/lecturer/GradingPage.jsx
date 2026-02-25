import React, { useState, useMemo } from "react";
import { getGroups, getGrades } from "../../services/mockDb.service.js";
import { GradingView } from "./GradingView.jsx";
import "../admin/adminManagement.css";

const MY_LECTURER_ID = 2;

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function GradingPage() {
  const allGroups = useMemo(() => getGroups(), []);
  const initialGrades = useMemo(() => getGrades(), []);

  const [grades, setGrades] = useState(initialGrades);
  const [editingId, setEditingId] = useState(null);
  const [draftScore, setDraftScore] = useState("");
  const [draftFeedback, setDraftFeedback] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const myGrades = useMemo(
    () => grades.filter((g) => g.lecturer_id === MY_LECTURER_ID),
    [grades],
  );

  const filteredGrades = useMemo(() => {
    if (filterStatus === "ALL") return myGrades;
    return myGrades.filter((g) => g.status === filterStatus);
  }, [myGrades, filterStatus]);

  const openEdit = (gr) => {
    setEditingId(gr.id);
    setDraftScore(gr.score ?? "");
    setDraftFeedback(gr.feedback ?? "");
  };

  const saveGrade = (id) => {
    const score = parseFloat(draftScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert("Score must be between 0 and 10.");
      return;
    }
    setGrades((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, score, feedback: draftFeedback, status: "GRADED" }
          : g,
      ),
    );
    setEditingId(null);
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
    />
  );
}

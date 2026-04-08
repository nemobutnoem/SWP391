import React, { useEffect, useState } from "react";
import { topicService } from "../../services/topics/topic.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { TopicsView } from "./TopicsView.jsx";
import "./topics.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");

  useEffect(() => {
    Promise.all([topicService.list(), semesterService.list(), classService.list()]).then(([t, sems, cls]) => {
      setTopics(Array.isArray(t) ? t : []);
      const semesterList = Array.isArray(sems) ? sems : [];
      setSemesters(semesterList);
      setClasses(Array.isArray(cls) ? cls : []);

      const active = semesterList.find((s) => String(s.status || "").toUpperCase() === "ACTIVE");
      if (active?.id != null) {
        setSelectedSemesterId(String(active.id));
      } else if (semesterList[0]?.id != null) {
        setSelectedSemesterId(String(semesterList[0].id));
      }
    });
  }, []);

  // Keep classes fresh so create-lock logic reflects latest semester setup
  useEffect(() => {
    classService.list().then((cls) => setClasses(Array.isArray(cls) ? cls : [])).catch(() => {});
  }, [selectedSemesterId]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const selectedSemester = selectedSemesterId
    ? semesters.find((s) => String(s.id) === String(selectedSemesterId)) || null
    : null;
  const selectedSemesterStatus = String(selectedSemester?.status || "").toUpperCase();
  const isCrudLocked = Boolean(selectedSemester) && selectedSemesterStatus === "COMPLETED";

  const isCapstoneRunningForSelectedSemester = (() => {
    if (!selectedSemester || selectedSemesterStatus !== "ACTIVE") return false;
    const today = new Date();
    const toDate = (v) => {
      if (!v) return null;
      // Accept "YYYY-MM-DD" or Date
      const d = v instanceof Date ? v : new Date(String(v));
      return Number.isFinite(d.getTime()) ? d : null;
    };

    return (Array.isArray(classes) ? classes : [])
      .filter((c) => String(c?.semester_id ?? c?.semesterId ?? "") === String(selectedSemesterId))
      .filter((c) => String(c?.class_type ?? c?.classType ?? "MAIN").toUpperCase() === "CAPSTONE")
      .some((c) => {
        const start = toDate(c?.start_date ?? c?.startDate);
        const end = toDate(c?.end_date ?? c?.endDate);
        if (start && end) return start <= today && today <= end;
        if (start && !end) return start <= today;
        return false;
      });
  })();

  const createLockReason = (() => {
    if (isCrudLocked) return "This semester is completed. Topics are view-only.";
    if (!selectedSemesterId || !selectedSemester) return "Please select a semester.";
    if (selectedSemesterStatus === "UPCOMING") {
      // Check if semester has classes
      const semClasses = (Array.isArray(classes) ? classes : [])
        .filter((c) => String(c?.semester_id ?? c?.semesterId ?? "") === String(selectedSemesterId));
      if (semClasses.length === 0) return "No classes in this semester yet. Create classes first.";
      return null; // allow creating MAIN topics
    }
    if (selectedSemesterStatus === "ACTIVE") {
      if (isCapstoneRunningForSelectedSemester) return "Capstone (3-week) is in progress. You can only create topics for upcoming semesters.";
      return null; // allow creating CAPSTONE topics
    }
    return "You can only create topics for UPCOMING or ACTIVE semesters.";
  })();

  const isCreateLocked = Boolean(createLockReason);
  // Upcoming → lock to MAIN, Active (no capstone running) → lock to CAPSTONE
  const lockBlockTypeTo = selectedSemesterStatus === "UPCOMING"
    ? "MAIN"
    : selectedSemesterStatus === "ACTIVE" && !isCapstoneRunningForSelectedSemester
      ? "CAPSTONE"
      : null;

  const filteredTopics = topics.filter((t) => {
    const semId = t?.semester_id ?? t?.semesterId;
    const semOk = !selectedSemesterId || String(semId) === String(selectedSemesterId);
    const block = String(t?.block_type ?? t?.blockType ?? "MAIN").toUpperCase();
    const blockOk = blockFilter === "ALL" || block === blockFilter;
    return semOk && blockOk;
  });

  const handleOpenCreate = () => {
    if (isCreateLocked) {
      alert(createLockReason);
      return;
    }
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic) => {
    if (isCrudLocked) {
      alert("This semester is completed. Topics are view-only.");
      return;
    }
    setEditingTopic(topic);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (isCrudLocked) {
        alert("This semester is completed. Topics are view-only.");
        return;
      }

      if (!editingTopic && isCreateLocked) {
        alert(createLockReason);
        return;
      }

      const payload = {
        ...formData,
        semester_id: Number(selectedSemesterId),
      };

      if (editingTopic) {
        await topicService.update(editingTopic.id, payload);
      } else {
        await topicService.create(payload);
      }
      const updatedTopics = await topicService.list();
      setTopics(updatedTopics);
      setIsModalOpen(false);
    } catch (e) {
      const fieldErrors = e?.data?.details?.fields;
      const details = fieldErrors && typeof fieldErrors === "object"
        ? Object.entries(fieldErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n")
        : null;
      alert("Error saving topic: " + (details || e?.data?.message || e.message));
      throw e;
    }
  };

  const handleArchive = async (id) => {
    try {
      if (isCrudLocked) {
        alert("This semester is completed. Topics are view-only.");
        return;
      }
      if (window.confirm("Are you sure you want to archive this topic?")) {
        await topicService.archive(id);
        const updatedTopics = await topicService.list();
        setTopics(updatedTopics);
      }
    } catch (e) {
      alert("Failed to archive topic: " + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (topic) => {
    try {
      if (isCrudLocked) {
        alert("This semester is completed. Topics are view-only.");
        return;
      }
      const usage = await topicService.checkUsage(topic.id);
      let confirmed;
      if (usage.inUse) {
        confirmed = window.confirm(
          `This topic is currently assigned to: ${usage.groups.join(", ")}.\nAre you sure you want to delete it? The topic will be unlinked from these groups.`
        );
      } else {
        confirmed = window.confirm(`Are you sure you want to delete topic "${topic.name}"?`);
      }
      if (confirmed) {
        await topicService.remove(topic.id);
        const updatedTopics = await topicService.list();
        setTopics(updatedTopics);
      }
    } catch (e) {
      alert("Failed to delete topic: " + (e?.data?.message || e.message));
    }
  };

  return (
    <TopicsView
      topics={filteredTopics}
      semesters={semesters}
      selectedSemesterId={selectedSemesterId}
      onSelectedSemesterIdChange={setSelectedSemesterId}
      blockFilter={blockFilter}
      onBlockFilterChange={setBlockFilter}
      isCrudLocked={isCrudLocked}
      isCreateLocked={isCreateLocked}
      lockBlockTypeTo={lockBlockTypeTo}
      defaultBlockType={lockBlockTypeTo || (blockFilter === "ALL" ? "MAIN" : blockFilter)}
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

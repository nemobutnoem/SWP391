import React, { useState, useMemo } from "react";
import {
  getGroups,
  getTopics,
  getLecturers,
  getGroupMembers,
  getStudents,
} from "../../services/mockDb.service.js";
import { AllocationView } from "./AllocationView.jsx";
import "./adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function AllocationPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const groups = useMemo(() => getGroups(), []);
  const topics = useMemo(() => getTopics(), []);
  const lecturers = useMemo(() => getLecturers(), []);
  const members = useMemo(() => getGroupMembers(), []);
  const students = useMemo(() => getStudents(), []);

  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const groupMembers = members
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          return { ...m, ...student };
        });

      const topic = topics.find((t) => t.id === g.project_id);

      return {
        ...g,
        members: groupMembers,
        topic_name: topic?.name || "Unassigned",
      };
    });
  }, [groups, members, students, topics]);

  const toggleExpand = (id) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  const handleConfirmAllocation = (groupName) => {
    alert(`Successfully allocated Topic and Supervisor for group: ${groupName}`);
  };

  return (
    <AllocationView
      enrichedGroups={enrichedGroups}
      topics={topics}
      lecturers={lecturers}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
      onConfirmAllocation={handleConfirmAllocation}
    />
  );
}

import React, { useState, useMemo } from "react";
import {
  getGroups,
  getGroupMembers,
  getStudents,
  getGrades,
} from "../../services/mockDb.service.js";
import { MyGroupsView } from "./MyGroupsView.jsx";
import "../admin/adminManagement.css";

const MY_LECTURER_ID = 2;

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function MyGroupsPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const allGroups = useMemo(() => getGroups(), []);
  const allMembers = useMemo(() => getGroupMembers(), []);
  const students = useMemo(() => getStudents(), []);
  const grades = useMemo(() => getGrades(), []);

  const myGroups = useMemo(
    () => allGroups.filter((g) => g.supervisor_id === MY_LECTURER_ID),
    [allGroups],
  );

  const enrichedGroups = useMemo(() => {
    return myGroups.map((g) => {
      const members = allMembers
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          return { ...m, ...student };
        });

      const groupGrades = grades.filter(
        (gr) => gr.group_id === g.id && gr.lecturer_id === MY_LECTURER_ID,
      );
      const gradedGrades = groupGrades.filter((gr) => gr.score !== null);
      const avgScore =
        gradedGrades.length > 0
          ? (gradedGrades.reduce((s, gr) => s + gr.score, 0) / gradedGrades.length).toFixed(1)
          : null;

      return { ...g, members, groupGrades, avgScore };
    });
  }, [myGroups, allMembers, students, grades]);

  const toggleExpand = (id) =>
    setExpandedGroupId(expandedGroupId === id ? null : id);

  return (
    <MyGroupsView
      enrichedGroups={enrichedGroups}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
    />
  );
}

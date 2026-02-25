import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { studentService } from "../../services/students/student.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { MyGroupsView } from "./MyGroupsView.jsx";
import "../admin/adminManagement.css";

const MY_LECTURER_ID = 2;

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function MyGroupsPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    studentService.list().then(setStudents);
    gradeService.list().then(setGrades);
  }, []);

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

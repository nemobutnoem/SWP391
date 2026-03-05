import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { topicService } from "../../services/topics/topic.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { studentService } from "../../services/students/student.service.js";
import { AllocationView } from "./AllocationView.jsx";
import "./adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function AllocationPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    groupService.list().then(setGroups);
    groupService.listMembers().then(setMembers);
    topicService.list().then(setTopics);
    lecturerService.list().then(setLecturers);
    studentService.list().then(setStudents);
  }, []);

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

  const handleAllocationChange = (groupId, field, value) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, [field]: value ? Number(value) : null } : g))
    );
  };

  const handleConfirmAllocation = async (group) => {
    try {
      if (group.project_id !== undefined) {
        await groupService.assignTopicAdmin(group.id, group.project_id);
      }
      if (group.lecturer_id !== undefined) {
        await groupService.assignLecturer(group.id, group.lecturer_id);
      }
      alert(`Successfully allocated Topic and Supervisor for group: ${group.group_name}`);
    } catch (e) {
      alert("Failed to allocate: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <AllocationView
      enrichedGroups={enrichedGroups}
      topics={topics}
      lecturers={lecturers}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
      onAllocationChange={handleAllocationChange}
      onConfirmAllocation={handleConfirmAllocation}
    />
  );
}

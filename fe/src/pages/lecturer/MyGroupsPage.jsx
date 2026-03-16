import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { studentService } from "../../services/students/student.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { MyGroupsView } from "./MyGroupsView.jsx";
import "../admin/adminManagement.css";

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

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Add-member modal state
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);

  const loadData = () => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    studentService.list().then(setStudents);
    gradeService.list().then(setGrades);
    semesterService.list().then((data) => {
      setSemesters(data);
      const active = data.find((s) => s.status?.toLowerCase() === "active");
      if (active) setSelectedSemesterId(active.id);
    });
    classService.list().then(setAllClasses);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter groups by selected semester/class (optional)
  const myGroups = useMemo(() => {
    const bySem = selectedSemesterId
      ? allGroups.filter((g) => (g.semester_id ?? g.semesterId) === selectedSemesterId)
      : allGroups;
    const byClass = selectedClassId
      ? bySem.filter((g) => (g.class_id ?? g.classId) === selectedClassId)
      : bySem;
    return byClass;
  }, [allGroups, selectedSemesterId, selectedClassId]);

  const enrichedGroups = useMemo(() => {
    return myGroups.map((g) => {
      const members = allMembers
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          return { ...student, ...m, member_id: m.id };
        });

      const groupGrades = grades.filter(
        (gr) => gr.group_id === g.id,
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

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await groupService.updateMemberRole(memberId, newRole);
      setAllMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role_in_group: newRole } : m)),
      );
    } catch (err) {
      alert("Failed to update role: " + (err.message || err));
    }
  };

  const handleAddMember = async (groupId, studentId, role) => {
    try {
      await groupService.addMember(groupId, studentId, role);
      loadData();
    } catch (err) {
      alert("Failed to add member: " + (err.response?.data?.message || err.message || err));
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await groupService.removeMember(groupId, memberId);
      loadData();
    } catch (err) {
      alert("Failed to remove member: " + (err.message || err));
    }
  };

  const handleCreateGroup = async (formData) => {
    try {
      await groupService.create(formData);
      loadData();
      setShowCreateModal(false);
    } catch (err) {
      alert("Failed to create group: " + (err.response?.data?.message || err.message || err));
    }
  };

  // Students available to add (not already in the target group)
  const availableStudents = useMemo(() => {
    if (!addMemberGroupId) return [];
    const memberStudentIds = new Set(
      allMembers.filter((m) => m.group_id === addMemberGroupId).map((m) => m.student_id),
    );
    return students.filter((s) => !memberStudentIds.has(s.id));
  }, [addMemberGroupId, allMembers, students]);

  return (
    <MyGroupsView
      enrichedGroups={enrichedGroups}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
      onRoleChange={handleRoleChange}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
      addMemberGroupId={addMemberGroupId}
      onOpenAddMember={setAddMemberGroupId}
      onCloseAddMember={() => setAddMemberGroupId(null)}
      availableStudents={availableStudents}
      showCreateModal={showCreateModal}
      onOpenCreateModal={() => setShowCreateModal(true)}
      onCloseCreateModal={() => setShowCreateModal(false)}
      onCreateGroup={handleCreateGroup}
      semesters={semesters}
      allClasses={allClasses}
      semesterOptions={semesters}
      classOptions={allClasses}
      selectedSemesterId={selectedSemesterId}
      selectedClassId={selectedClassId}
      onSemesterChange={(id) => {
        setSelectedSemesterId(id);
        setSelectedClassId(null);
      }}
      onClassChange={setSelectedClassId}
    />
  );
}

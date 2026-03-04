import React, { useEffect, useState, useMemo } from "react";
import { studentService } from "../../services/students/student.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { projectService } from "../../services/projects/project.service.js";
import { UserManagementView } from "./UserManagementView.jsx";
import "./adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState("STUDENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [localStudents, setLocalStudents] = useState([]);
  const [localLecturers, setLocalLecturers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    studentService.list().then(setLocalStudents);
    lecturerService.list().then(setLocalLecturers);
    groupService.list().then(setGroups);
    projectService.list().then(setProjects);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMajorFilter("ALL");
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData) => {
    if (formData.role === "STUDENT") {
      if (editingUser) {
        setLocalStudents((prev) =>
          prev.map((s) => s.id === editingUser.id ? { ...formData, id: s.id } : s),
        );
      } else {
        setLocalStudents((prev) => [{ ...formData, id: Date.now() }, ...prev]);
      }
    } else {
      if (editingUser) {
        setLocalLecturers((prev) =>
          prev.map((l) => l.id === editingUser.id ? { ...formData, id: l.id } : l),
        );
      } else {
        setLocalLecturers((prev) => [{ ...formData, id: Date.now() }, ...prev]);
      }
    }
    setIsModalOpen(false);
    alert(`Successfully ${editingUser ? "updated" : "created"} user: ${formData.full_name}`);
  };

  const enrichedStudents = useMemo(() => {
    return localStudents.map((s) => {
      const group =
        groups.find((g) => g.id === s.group_id) ||
        groups.find((g) => g.leader_student_id === s.id);
      const project = group ? projects.find((p) => p.id === group.project_id) : null;
      return {
        ...s,
        group_name: group?.group_name || "Unassigned",
        project_name: project?.project_name || "No Project",
      };
    });
  }, [localStudents, groups, projects]);

  const filteredData = useMemo(() => {
    const data = activeTab === "STUDENTS" ? enrichedStudents : localLecturers;
    return data.filter((u) => {
      const nameMatch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const codeMatch = u.student_code && u.student_code.toLowerCase().includes(searchQuery.toLowerCase());
      const majorMatch = majorFilter === "ALL" || u.major === majorFilter;
      return (nameMatch || codeMatch) && majorMatch;
    });
  }, [activeTab, enrichedStudents, localLecturers, searchQuery, majorFilter]);

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      if (activeTab === "STUDENTS") {
        setLocalStudents((prev) => prev.filter((s) => s.id !== user.id));
      } else {
        setLocalLecturers((prev) => prev.filter((l) => l.id !== user.id));
      }
      alert("User deleted successfully.");
    }
  };

  return (
    <UserManagementView
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      majorFilter={majorFilter}
      onMajorFilterChange={setMajorFilter}
      filteredData={filteredData}
      isModalOpen={isModalOpen}
      editingUser={editingUser}
      onOpenCreate={handleOpenCreate}
      onOpenEdit={handleOpenEdit}
      onCloseModal={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      studentCount={localStudents.length}
      lecturerCount={localLecturers.length}
    />
  );
}

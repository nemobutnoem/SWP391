import React, { useEffect, useState, useMemo } from "react";
import { studentService } from "../../services/students/student.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { projectService } from "../../services/projects/project.service.js";
import { classService } from "../../services/classes/class.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { UserManagementView } from "./UserManagementView.jsx";
import "./adminManagement.css";

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState("STUDENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalRole, setModalRole] = useState("STUDENT");

  const [localStudents, setLocalStudents] = useState([]);
  const [localLecturers, setLocalLecturers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    studentService.list().then(setLocalStudents);
    lecturerService.list().then(setLocalLecturers);
    groupService.list().then(setGroups);
    groupService.listMembers().then(setMembers);
    projectService.list().then(setProjects);
    classService.list().then(setClasses);
    semesterService.list().then(setSemesters);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMajorFilter("ALL");
    setSearchQuery("");
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setModalRole(activeTab === "LECTURERS" ? "LECTURER" : "STUDENT");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setModalRole(activeTab === "LECTURERS" ? "LECTURER" : "STUDENT");
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      const payload = { ...formData };
      if (payload.class_id === "") payload.class_id = null;

      if (formData.role === "STUDENT") {
        if (editingUser) {
          await studentService.update(editingUser.id, payload);
        } else {
          await studentService.create(payload);
        }
        const updatedStudents = await studentService.list();
        setLocalStudents(updatedStudents);
      } else {
        if (editingUser) {
          await lecturerService.update(editingUser.id, payload);
        } else {
          await lecturerService.create(payload);
        }
        const updatedLecturers = await lecturerService.list();
        setLocalLecturers(updatedLecturers);
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      console.error("Error saving user:", e);
      throw new Error(e.response?.data?.message || e.message || "Unknown error occurred");
    }
  };

  const enrichedStudents = useMemo(() => {
    return localStudents.map((s) => {
      const membership = members.find((m) => m.student_id === s.id);
      const group = membership
        ? groups.find((g) => g.id === membership.group_id)
        : groups.find((g) => g.leader_student_id === s.id);
      const project = group ? projects.find((p) => p.id === group.project_id) : null;
      const clazz = classes.find((c) => c.id === s.class_id);
      const semester = semesters.find((sem) => sem.id === s.semester_id) ||
        (clazz ? semesters.find((sem) => sem.id === clazz.semester_id) : null);

      return {
        ...s,
        group_name: group?.group_name || "Unassigned",
        project_name: project?.project_name || project?.name || "No Project",
        class_name: clazz?.class_code || "No Class",
        semester_name: semester?.name || "No Semester",
      };
    });
  }, [localStudents, groups, members, projects, classes, semesters]);

  const enrichedLecturers = useMemo(() => {
    return localLecturers.map((l) => {
      const managedClasses = classes.filter((c) => c.lecturer_id === l.id);
      const managedGroups = managedClasses.flatMap((c) => groups.filter((g) => g.class_id === c.id));
      return { ...l, managed_class_count: managedClasses.length, managed_group_count: managedGroups.length };
    });
  }, [localLecturers, classes, groups]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (activeTab === "STUDENTS") {
      return enrichedStudents.filter((u) => {
        const nameMatch = u.full_name.toLowerCase().includes(q);
        const codeMatch = u.student_code && u.student_code.toLowerCase().includes(q);
        const majorMatch = majorFilter === "ALL" || u.major === majorFilter;
        return (nameMatch || codeMatch) && majorMatch;
      });
    }

    return enrichedLecturers.filter((u) => {
      const nameMatch = u.full_name.toLowerCase().includes(q);
      const departmentMatch = (u.department || "").toLowerCase().includes(q);
      return !q || nameMatch || departmentMatch;
    });
  }, [activeTab, enrichedStudents, enrichedLecturers, searchQuery, majorFilter]);

  const handleDelete = async (user) => {
    let warning = `Are you sure you want to delete ${user.full_name}?`;
    if (activeTab === "LECTURERS") {
      const classCount = classes.filter((c) => c.lecturer_id === user.id).length;
      if (classCount > 0) {
        warning = `${user.full_name} is assigned to ${classCount} class(es). Unassign them first before deleting. Continue?`;
      }
    }
    if (window.confirm(warning)) {
      try {
        if (activeTab === "STUDENTS") {
          await studentService.remove(user.id);
          const updated = await studentService.list();
          setLocalStudents(updated);
        } else {
          await lecturerService.remove(user.id);
          const updated = await lecturerService.list();
          setLocalLecturers(updated);
        }
        alert("User deleted successfully.");
      } catch (e) {
        alert("Failed to delete user: " + (e.response?.data?.message || e.message));
      }
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
      modalRole={modalRole}
      onOpenCreate={handleOpenCreate}
      onOpenEdit={handleOpenEdit}
      onCloseModal={() => {
        setIsModalOpen(false);
        setEditingUser(null);
      }}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      studentCount={localStudents.length}
      lecturerCount={localLecturers.length}
      classes={classes}
    />
  );
}

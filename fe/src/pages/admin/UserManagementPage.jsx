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
  const [statusFilter, setStatusFilter] = useState("ALL");
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

  const toNum = (v) => Number(v);
  const isSameId = (a, b) => Number.isFinite(toNum(a)) && Number.isFinite(toNum(b)) && toNum(a) === toNum(b);

  const loadAllData = async () => {
    const [studentsData, lecturersData, groupsData, membersData, projectsData, classesData, semestersData] = await Promise.all([
      studentService.list(),
      lecturerService.list(),
      groupService.list(),
      groupService.listMembers(),
      projectService.list(),
      classService.list(),
      semesterService.list(),
    ]);
    setLocalStudents(Array.isArray(studentsData) ? studentsData : []);
    setLocalLecturers(Array.isArray(lecturersData) ? lecturersData : []);
    setGroups(Array.isArray(groupsData) ? groupsData : []);
    setMembers(Array.isArray(membersData) ? membersData : []);
    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setClasses(Array.isArray(classesData) ? classesData : []);
    setSemesters(Array.isArray(semestersData) ? semestersData : []);
  };

  useEffect(() => {
    loadAllData().catch((err) => {
      console.error("Failed to load admin data:", err);
    });
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMajorFilter("ALL");
    setStatusFilter("ALL");
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
      } else {
        if (editingUser) {
          await lecturerService.update(editingUser.id, payload);
        } else {
          await lecturerService.create(payload);
        }
      }
      await loadAllData();
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      console.error("Error saving user:", e);
      throw new Error(e.response?.data?.message || e.message || "Unknown error occurred");
    }
  };

  const enrichedStudents = useMemo(() => {
    return localStudents.map((s) => {
      const membership = members.find((m) => isSameId(m.student_id ?? m.studentId, s.id));
      const group = membership
        ? groups.find((g) => isSameId(g.id, membership.group_id ?? membership.groupId))
        : groups.find((g) => isSameId(g.leader_student_id ?? g.leaderStudentId, s.id));
      const project = group ? projects.find((p) => isSameId(p.id, group.project_id ?? group.projectId)) : null;
      const clazz = classes.find((c) => isSameId(c.id, s.class_id ?? s.classId));
      const semester = semesters.find((sem) => isSameId(sem.id, s.semester_id ?? s.semesterId)) ||
        (clazz ? semesters.find((sem) => isSameId(sem.id, clazz.semester_id ?? clazz.semesterId)) : null);

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
        const statusMatch = statusFilter === "ALL" || String(u.status || "").toUpperCase() === statusFilter;
        return (nameMatch || codeMatch) && majorMatch && statusMatch;
      });
    }

    return enrichedLecturers.filter((u) => {
      const nameMatch = u.full_name.toLowerCase().includes(q);
      const departmentMatch = (u.department || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "ALL" || String(u.status || "").toUpperCase() === statusFilter;
      return (!q || nameMatch || departmentMatch) && statusMatch;
    });
  }, [activeTab, enrichedStudents, enrichedLecturers, searchQuery, majorFilter, statusFilter]);

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
        } else {
          await lecturerService.remove(user.id);
        }
        await loadAllData();
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
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
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

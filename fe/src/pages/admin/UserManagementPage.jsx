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
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [blockFilter, setBlockFilter] = useState("ALL");
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

  // Default semester selection (prefer Active) since we don't expose "All Semesters" in UI.
  useEffect(() => {
    if (!Array.isArray(semesters) || semesters.length === 0) return;
    if (semesterFilter !== "ALL") return;

    const active = semesters.find((s) => String(s.status || "").toUpperCase() === "ACTIVE");
    const fallback = active || [...semesters].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))[0];
    if (fallback?.id != null) setSemesterFilter(String(fallback.id));
  }, [semesters, semesterFilter]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMajorFilter("ALL");
    setStatusFilter("ALL");
    if (Array.isArray(semesters) && semesters.length > 0) {
      const active = semesters.find((s) => String(s.status || "").toUpperCase() === "ACTIVE");
      const fallback = active || [...semesters].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))[0];
      setSemesterFilter(fallback?.id != null ? String(fallback.id) : "ALL");
    } else {
      setSemesterFilter("ALL");
    }
    setBlockFilter("ALL");
    setSearchQuery("");
  };

  const selectedSemester = useMemo(() => {
    if (semesterFilter === "ALL") return null;
    return semesters.find((s) => isSameId(s.id, semesterFilter)) || null;
  }, [semesterFilter, semesters]);

  const isCrudLockedByCompletedSemester = useMemo(() => {
    if (activeTab !== "STUDENTS") return false;
    if (!selectedSemester) return false;
    const status = String(selectedSemester.status ?? "").toUpperCase();
    return status === "COMPLETED";
  }, [activeTab, selectedSemester]);

  const handleOpenCreate = () => {
    if (isCrudLockedByCompletedSemester) {
      alert("This semester is completed. You can only view students.");
      return;
    }
    setEditingUser(null);
    setModalRole(activeTab === "LECTURERS" ? "LECTURER" : "STUDENT");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    if (isCrudLockedByCompletedSemester) {
      alert("This semester is completed. You can only view students.");
      return;
    }
    setEditingUser(user);
    setModalRole(activeTab === "LECTURERS" ? "LECTURER" : "STUDENT");
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (isCrudLockedByCompletedSemester && formData.role === "STUDENT") {
        alert("This semester is completed. You can only view students in completed semesters.");
        return;
      }
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
      const resolvedSemesterId =
        (s.semester_id ?? s.semesterId) ?? (clazz?.semester_id ?? clazz?.semesterId) ?? null;
      const semester =
        semesters.find((sem) => isSameId(sem.id, resolvedSemesterId)) ||
        (clazz ? semesters.find((sem) => isSameId(sem.id, clazz.semester_id ?? clazz.semesterId)) : null);

      const classTypeRaw = clazz ? (clazz.class_type ?? clazz.classType ?? "MAIN") : null;
      const classType = classTypeRaw == null ? null : String(classTypeRaw || "MAIN").toUpperCase();

      return {
        ...s,
        group_name: group?.group_name || "Unassigned",
        project_name: project?.project_name || project?.name || "No Project",
        class_name: clazz?.class_code || "No Class",
        semester_name: semester?.name || "No Semester",
        _semesterId: resolvedSemesterId == null ? null : Number(resolvedSemesterId),
        _classType: classType == null ? null : classType === "CAPSTONE" ? "CAPSTONE" : "MAIN",
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
        const semesterMatch =
          semesterFilter === "ALL" ||
          (u._semesterId != null && Number(u._semesterId) === Number(semesterFilter));
        const blockMatch = blockFilter === "ALL" || (u._classType != null && String(u._classType) === blockFilter);
        return (nameMatch || codeMatch) && majorMatch && statusMatch && semesterMatch && blockMatch;
      });
    }

    return enrichedLecturers.filter((u) => {
      const nameMatch = u.full_name.toLowerCase().includes(q);
      const departmentMatch = (u.department || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "ALL" || String(u.status || "").toUpperCase() === statusFilter;
      return (!q || nameMatch || departmentMatch) && statusMatch;
    });
  }, [activeTab, enrichedStudents, enrichedLecturers, searchQuery, majorFilter, statusFilter, semesterFilter, blockFilter]);

  const scopedStudentCount = useMemo(() => {
    // Count students in the currently selected semester/block scope (ignore search/major/status)
    if (semesterFilter === "ALL" && blockFilter === "ALL") return localStudents.length;
    return enrichedStudents.filter((u) => {
      const semesterMatch =
        semesterFilter === "ALL" ||
        (u._semesterId != null && Number(u._semesterId) === Number(semesterFilter));
      const blockMatch = blockFilter === "ALL" || (u._classType != null && String(u._classType) === blockFilter);
      return semesterMatch && blockMatch;
    }).length;
  }, [enrichedStudents, localStudents.length, semesterFilter, blockFilter]);

  const handleDelete = async (user) => {
    if (isCrudLockedByCompletedSemester && activeTab === "STUDENTS") {
      alert("This semester is completed. You can only view students in completed semesters.");
      return;
    }
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
      semesterFilter={semesterFilter}
      onSemesterFilterChange={setSemesterFilter}
      blockFilter={blockFilter}
      onBlockFilterChange={setBlockFilter}
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
      studentCount={scopedStudentCount}
      lecturerCount={localLecturers.length}
      classes={classes}
      semesters={semesters}
      isCrudLocked={isCrudLockedByCompletedSemester}
    />
  );
}

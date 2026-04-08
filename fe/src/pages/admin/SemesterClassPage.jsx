import React, { useEffect, useState, useMemo } from "react";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { studentService } from "../../services/students/student.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { SemesterClassView } from "./SemesterClassView.jsx";
import "./adminManagement.css";

export function SemesterClassPage() {
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState({});

  const [selectedSemesterId, setSelectedSemesterId] = useState(null);

  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningClass, setAssigningClass] = useState(null);

  const sortSemestersDesc = (items) => {
    const list = Array.isArray(items) ? [...items] : [];
    const toKey = (s) => {
      // Prefer start_date, then end_date, then id.
      // Dates are ISO (YYYY-MM-DD) so lexicographic compare is fine.
      return String(s?.start_date || s?.end_date || "");
    };
    list.sort((a, b) => {
      const ka = toKey(a);
      const kb = toKey(b);
      if (ka !== kb) return kb.localeCompare(ka);
      const ia = Number(a?.id || 0);
      const ib = Number(b?.id || 0);
      return ib - ia;
    });
    return list;
  };

  useEffect(() => {
    semesterService.list().then((data) => {
      const sorted = sortSemestersDesc(data);
      setSemesters(sorted);
      const active = sorted.find((s) => s.status?.toLowerCase() === "active");
      if (active) setSelectedSemesterId(active.id);
      else if (sorted.length > 0) setSelectedSemesterId(sorted[0].id);
    });
    lecturerService.list().then(setLecturers);
    studentService.list().then(setStudents);
    groupService.list().then(setGroups);
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      classService.list(selectedSemesterId).then((cls) => {
        setClasses(cls);
        // Load enrollments for CAPSTONE classes
        const capstoneClasses = cls.filter((c) => (c.class_type || "MAIN") === "CAPSTONE");
        capstoneClasses.forEach((c) => {
          classService.listEnrollments(c.id).then((data) => {
            setEnrollments((prev) => ({ ...prev, [c.id]: data }));
          }).catch(() => {});
        });
      });
    } else {
      setClasses([]);
    }
  }, [selectedSemesterId]);

  const isCapstoneRunning = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return classes.some((c) => {
      const isCapstone = (c.class_type || "MAIN") === "CAPSTONE";
      if (!isCapstone) return false;
      const isActive = String(c.status || "").toLowerCase() === "active";
      if (!isActive) return false;
      // If dates are missing, treat an Active CAPSTONE class as running.
      const startOk = !c.start_date || String(c.start_date) <= today;
      const endOk = !c.end_date || today <= String(c.end_date);
      return startOk && endOk;
    });
  }, [classes]);

  const eligibleStudentsForSelectedSemester = useMemo(() => {
    // Show only students that belong to the selected semester.
    if (!selectedSemesterId) return Array.isArray(students) ? students : [];
    const list = Array.isArray(students) ? students : [];

    const isEmptyId = (v) => v == null || String(v).trim() === "";
    const isUnassigned = (student) => {
      const semId = student?.semester_id ?? student?.semesterId;
      const classId = student?.class_id ?? student?.classId;
      return isEmptyId(semId) && isEmptyId(classId);
    };

    const resolveSemesterId = (student) => {
      const direct = student?.semester_id ?? student?.semesterId;
      if (direct != null && String(direct).trim() !== "") return direct;
      const classId = student?.class_id ?? student?.classId;
      if (classId == null || String(classId).trim() === "") return null;
      // We only have the currently selected semester's classes in state; this fallback is mainly
      // for older payloads that didn't include semester_id.
      const cls = classes.find((c) => String(c?.id) === String(classId));
      // If classId is not in this semester's classes, the student belongs to another semester.
      // Do NOT treat them as unassigned.
      if (!cls) return "__OTHER_SEMESTER__";
      return cls?.semester_id ?? cls?.semesterId ?? "__OTHER_SEMESTER__";
    };

    return list.filter((s) => {
      const semId = resolveSemesterId(s);
      if (semId == null) return isUnassigned(s); // include only truly unassigned students
      if (semId === "__OTHER_SEMESTER__") return false;
      return String(semId) === String(selectedSemesterId);
    });
  }, [selectedSemesterId, students, classes]);

  const enrichedClasses = useMemo(() => {
    return classes.map((c) => {
      const lecturer = lecturers.find((l) => l.id === c.lecturer_id);
      const classStudents = students.filter((s) => s.class_id === c.id || s.classId === c.id);
      const rawEnrollments = enrollments[c.id] || [];
      const classEnrollments = rawEnrollments.map((e) => {
        const enrollmentStudentId = e.student_id ?? e.studentId;
        const enrollmentStudentCode = e.student_code ?? e.studentCode;
        const student = students.find((s) =>
          (enrollmentStudentId != null && (s.id === enrollmentStudentId || s.id === Number(enrollmentStudentId))) ||
          (enrollmentStudentCode && (s.student_code === enrollmentStudentCode || s.studentCode === enrollmentStudentCode))
        );
        return {
          ...e,
          email: e.email ?? student?.email ?? null,
          student_email: e.student_email ?? student?.email ?? null,
          student_name: e.student_name ?? student?.full_name ?? student?.fullName ?? null,
          student_code: e.student_code ?? student?.student_code ?? student?.studentCode ?? null,
        };
      });
      const studentCount = classStudents.length + classEnrollments.length;
      const classGroups = groups.filter((g) => g.class_id === c.id || g.classId === c.id);
      return {
        ...c,
        lecturer_name: lecturer?.full_name || "Unassigned",
        student_count: studentCount,
        students: classStudents,
        enrollments: classEnrollments,
        groups: classGroups,
      };
    });
  }, [classes, lecturers, students, groups, enrollments]);

  const handleCreateSemester = () => {
    setEditingSemester(null);
    setSemesterModalOpen(true);
  };
  const handleEditSemester = (sem) => {
    setEditingSemester(sem);
    setSemesterModalOpen(true);
  };
  const handleSubmitSemester = async (formData) => {
    try {
      if (editingSemester) {
        await semesterService.update(editingSemester.id, formData);
      } else {
        await semesterService.create(formData);
      }
      const updated = sortSemestersDesc(await semesterService.list());
      setSemesters(updated);

      // If semester status changes (e.g., Upcoming -> Active), backend may auto-update class statuses.
      // Refresh classes list to reflect the latest data.
      if (selectedSemesterId) {
        const refreshed = await classService.list(selectedSemesterId);
        setClasses(refreshed);
      }

      setSemesterModalOpen(false);
      if (!selectedSemesterId && updated.length > 0) {
        setSelectedSemesterId(updated[0].id);
      }
    } catch (e) {
      alert("Error saving semester: " + (e.response?.data?.message || e.message));
    }
  };
  const handleDeleteSemester = async (id) => {
    const classCount = classes.filter((c) => c.semester_id === id).length;
    const warning = classCount > 0
      ? `This semester has ${classCount} class(es). You must remove all classes before deleting. Continue?`
      : "Are you sure you want to delete this semester?";
    if (!window.confirm(warning)) return;
    try {
      await semesterService.remove(id);
      const updated = sortSemestersDesc(await semesterService.list());
      setSemesters(updated);
      if (selectedSemesterId === id) {
        setSelectedSemesterId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    }
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setClassModalOpen(true);
  };
  const handleEditClass = (cls) => {
    setEditingClass(cls);
    setClassModalOpen(true);
  };
  const handleSubmitClass = async (formData) => {
    try {
      const payload = {
        ...formData,
        semester_id: selectedSemesterId,
        intake_year: formData.intake_year ? Number(formData.intake_year) : null,
        lecturer_id: formData.lecturer_id ? Number(formData.lecturer_id) : null,
        class_type: formData.class_type || "MAIN",
        prerequisite_class_id: formData.prerequisite_class_id ? Number(formData.prerequisite_class_id) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      if (editingClass) {
        await classService.update(editingClass.id, payload);
      } else {
        await classService.create(payload);
      }
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
      setClassModalOpen(false);
    } catch (e) {
      alert("Error saving class: " + (e.response?.data?.message || e.message));
    }
  };
  const handleDeleteClass = async (id) => {
    const studentCount = students.filter((s) => s.class_id === id).length;
    const warning = studentCount > 0
      ? `This class has ${studentCount} student(s). You must reassign them before deleting. Continue?`
      : "Are you sure you want to delete this class?";
    if (!window.confirm(warning)) return;
    try {
      await classService.remove(id);
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    }
  };

  const handleOpenAssign = (cls) => {
    setAssigningClass(cls);
    setAssignModalOpen(true);
  };
  const handleAssignLecturer = async (classId, lecturerId) => {
    try {
      const cls = classes.find((c) => c.id === classId);
      await classService.update(classId, {
        class_code: cls.class_code,
        class_name: cls.class_name,
        semester_id: cls.semester_id,
        major: cls.major,
        intake_year: cls.intake_year,
        department: cls.department,
        lecturer_id: lecturerId || null,
        status: cls.status,
        class_type: cls.class_type || "MAIN",
        prerequisite_class_id: cls.prerequisite_class_id || null,
        start_date: cls.start_date || null,
        end_date: cls.end_date || null,
      });
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
      setAssignModalOpen(false);
    } catch (e) {
      alert("Failed to assign: " + (e.response?.data?.message || e.message));
    }
  };

  const handleAddStudent = async (classId, student) => {
    try {
      const cls = classes.find((c) => c.id === classId);
      const isCapstone = (cls?.class_type || "MAIN") === "CAPSTONE";

      if (isCapstone) {
        // CAPSTONE class: use enrollment system so student keeps their 10w class
        await classService.enroll(classId, student.id);
        const data = await classService.listEnrollments(classId);
        setEnrollments((prev) => ({ ...prev, [classId]: data }));
      } else {
        // MAIN class: assign student directly
        const email = student.email || `${(student.student_code || "").toLowerCase()}@fpt.edu.vn`;
        await studentService.update(student.id, {
          user_id: student.user_id || student.userId,
          class_id: classId,
          full_name: student.full_name,
          student_code: student.student_code,
          email: email,
          major: student.major || "SE",
          github_username: student.github_username || null,
          status: student.status || "Active",
        });
        const updatedStudents = await studentService.list();
        setStudents(updatedStudents);
      }
    } catch (e) {
      alert("Failed to add student to class: " + (e?.data?.message || e?.response?.data?.message || e.message));
      throw e;
    }
  };

  const handleCompleteClass = async (id) => {
    const cls = classes.find((c) => c.id === id);
    if (!window.confirm(`Mark class "${cls?.class_code}" as Completed?`)) return;
    try {
      await classService.complete(id);
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
      // Refresh semesters — semester may have auto-completed
      const updatedSemesters = sortSemestersDesc(await semesterService.list());
      setSemesters(updatedSemesters);
    } catch (e) {
      alert("Failed: " + (e.response?.data?.message || e.message));
    }
  };

  const handleActivateClass = async (id) => {
    const cls = classes.find((c) => c.id === id);
    if (!window.confirm(`Activate class "${cls?.class_code}"?`)) return;
    try {
      await classService.activate(id);
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
    } catch (e) {
      alert("Failed: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <SemesterClassView
      semesters={semesters}
      selectedSemesterId={selectedSemesterId}
      onSelectSemester={setSelectedSemesterId}
      enrichedClasses={enrichedClasses}
      lecturers={lecturers}
      semesterModalOpen={semesterModalOpen}
      editingSemester={editingSemester}
      onCreateSemester={handleCreateSemester}
      onEditSemester={handleEditSemester}
      onCloseSemesterModal={() => setSemesterModalOpen(false)}
      onSubmitSemester={handleSubmitSemester}
      onDeleteSemester={handleDeleteSemester}
      classModalOpen={classModalOpen}
      editingClass={editingClass}
      onCreateClass={handleCreateClass}
      onEditClass={handleEditClass}
      onCloseClassModal={() => setClassModalOpen(false)}
      onSubmitClass={handleSubmitClass}
      onDeleteClass={handleDeleteClass}
      assignModalOpen={assignModalOpen}
      assigningClass={assigningClass}
      onOpenAssign={handleOpenAssign}
      onCloseAssignModal={() => setAssignModalOpen(false)}
      onAssignLecturer={handleAssignLecturer}
      onAddStudent={handleAddStudent}
      onCompleteClass={handleCompleteClass}
      onActivateClass={handleActivateClass}
      isCapstoneRunning={isCapstoneRunning}
      allStudents={eligibleStudentsForSelectedSemester}
    />
  );
}

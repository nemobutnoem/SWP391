import React, { useEffect, useState, useMemo } from "react";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { studentService } from "../../services/students/student.service.js";
import { SemesterClassView } from "./SemesterClassView.jsx";
import "./adminManagement.css";

export function SemesterClassPage() {
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState(null);

  // Modals
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningClass, setAssigningClass] = useState(null);

  useEffect(() => {
    semesterService.list().then((data) => {
      setSemesters(data);
      const active = data.find((s) => s.status?.toLowerCase() === "active");
      if (active) setSelectedSemesterId(active.id);
      else if (data.length > 0) setSelectedSemesterId(data[0].id);
    });
    lecturerService.list().then(setLecturers);
    studentService.list().then(setStudents);
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      classService.list(selectedSemesterId).then(setClasses);
    } else {
      setClasses([]);
    }
  }, [selectedSemesterId]);

  const enrichedClasses = useMemo(() => {
    return classes.map((c) => {
      const lecturer = lecturers.find((l) => l.id === c.lecturer_id);
      const studentCount = students.filter((s) => s.class_id === c.id).length;
      return {
        ...c,
        lecturer_name: lecturer?.full_name || "Unassigned",
        student_count: studentCount,
      };
    });
  }, [classes, lecturers, students]);

  // Semester handlers
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
      const updated = await semesterService.list();
      setSemesters(updated);
      setSemesterModalOpen(false);
      if (!selectedSemesterId && updated.length > 0) {
        setSelectedSemesterId(updated[0].id);
      }
    } catch (e) {
      alert("Error saving semester: " + (e.response?.data?.message || e.message));
    }
  };
  const handleDeleteSemester = async (id) => {
    const classCount = classes.filter(c => c.semester_id === id).length;
    const warning = classCount > 0
      ? `This semester has ${classCount} class(es). You must remove all classes before deleting. Continue?`
      : "Are you sure you want to delete this semester?";
    if (!window.confirm(warning)) return;
    try {
      await semesterService.remove(id);
      const updated = await semesterService.list();
      setSemesters(updated);
      if (selectedSemesterId === id) {
        setSelectedSemesterId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    }
  };

  // Class handlers
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
    const studentCount = students.filter(s => s.class_id === id).length;
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

  // Assign lecturer to class
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
      });
      const updated = await classService.list(selectedSemesterId);
      setClasses(updated);
      setAssignModalOpen(false);
    } catch (e) {
      alert("Failed to assign: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <SemesterClassView
      semesters={semesters}
      selectedSemesterId={selectedSemesterId}
      onSelectSemester={setSelectedSemesterId}
      enrichedClasses={enrichedClasses}
      lecturers={lecturers}
      // semester modal
      semesterModalOpen={semesterModalOpen}
      editingSemester={editingSemester}
      onCreateSemester={handleCreateSemester}
      onEditSemester={handleEditSemester}
      onCloseSemesterModal={() => setSemesterModalOpen(false)}
      onSubmitSemester={handleSubmitSemester}
      onDeleteSemester={handleDeleteSemester}
      // class modal
      classModalOpen={classModalOpen}
      editingClass={editingClass}
      onCreateClass={handleCreateClass}
      onEditClass={handleEditClass}
      onCloseClassModal={() => setClassModalOpen(false)}
      onSubmitClass={handleSubmitClass}
      onDeleteClass={handleDeleteClass}
      // assign lecturer
      assignModalOpen={assignModalOpen}
      assigningClass={assigningClass}
      onOpenAssign={handleOpenAssign}
      onCloseAssignModal={() => setAssignModalOpen(false)}
      onAssignLecturer={handleAssignLecturer}
    />
  );
}

import React, { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import "./adminManagement.css";

function SemesterFormModal({ isOpen, onClose, onSubmit, initialData, semesters }) {
  const isEdit = !!initialData;
  const currentStatus = initialData?.status || null;

  const baseStatusOptions = [
    { value: "Upcoming", label: "Upcoming" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
  ];

  // Check if another semester is already active
  const hasOtherActive = semesters?.some(
    (s) => s.status?.toLowerCase() === "active" && s.id !== initialData?.id
  );

  const statusOptions = baseStatusOptions.map((opt) => {
    // If another semester is active, block selecting Active (but keep it visible)
    const isActiveOption = opt.value === "Active";
    const isEditingActive = String(currentStatus || "").toLowerCase() === "active";
    const disabled = isActiveOption && hasOtherActive && !isEditingActive;
    return { ...opt, disabled };
  });

  const [form, setForm] = useState(() =>
    initialData
      ? {
          code: initialData.code || "",
          name: initialData.name || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          status: initialData.status || "Upcoming",
        }
      : { code: "", name: "", start_date: "", end_date: "", status: "Upcoming" }
  );

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Semester" : "Create Semester"}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
        if (!form.start_date) return alert("Start date is required.");
        if (!form.end_date) return alert("End date is required.");
        if (form.end_date <= form.start_date) return alert("End date must be after start date.");
        if (
          String(form.status || "").toLowerCase() === "active" &&
          hasOtherActive &&
          String(currentStatus || "").toLowerCase() !== "active"
        ) {
          return alert("Another semester is currently active. Complete it first to activate this one.");
        }
        onSubmit(form);
      }}>
        <div className="form-row">
          <div className="form-group">
            <label>Code</label>
            <input name="code" value={form.code} onChange={handle} placeholder="SP26" required />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handle} placeholder="Spring 2026" required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handle} required />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handle}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasOtherActive && String(currentStatus || "").toLowerCase() !== "active" && (
            <span style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.25rem", display: "block" }}>
              Another semester is currently active. Complete it first to activate this one.
            </span>
          )}
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">{initialData ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ClassFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lecturers,
  restrictCreateToCapstone = false,
  restrictCreateToMain = false,
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          class_code: initialData.class_code || "",
          class_name: initialData.class_name || "",
          major: initialData.major || "SE",
          intake_year: initialData.intake_year || new Date().getFullYear(),
          department: initialData.department || "",
          status: initialData.status || "Active",
          lecturer_id: initialData.lecturer_id || "",
          class_type: initialData.class_type || "MAIN",
          prerequisite_class_id: initialData.prerequisite_class_id || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
        }
      : {
          class_code: "",
          class_name: "",
          major: "SE",
          intake_year: new Date().getFullYear(),
          department: "",
          status: "Active",
          lecturer_id: "",
          class_type: restrictCreateToCapstone ? "CAPSTONE" : restrictCreateToMain ? "MAIN" : "MAIN",
          prerequisite_class_id: "",
          start_date: "",
          end_date: "",
        }
  );

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // When switching to MAIN, clear prerequisite (kept for backward-compat, prerequisite is optional)
  const handleTypeChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, class_type: val, prerequisite_class_id: val === "MAIN" ? "" : p.prerequisite_class_id }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Class" : "Create Class"}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
        if (!form.class_name || !form.class_name.trim()) return alert("Class name is required.");
        if (!initialData && restrictCreateToCapstone && form.class_type !== "CAPSTONE") {
          return alert("This semester is Active. Only Capstone (3 weeks) classes can be created.");
        }
        if (!initialData && restrictCreateToMain && form.class_type !== "MAIN") {
          return alert("This semester is Upcoming. Only Main (10 weeks) classes can be created.");
        }
        const year = Number(form.intake_year);
        const currentYear = new Date().getFullYear();
        if (form.intake_year && (year < 2000 || year > currentYear + 1)) return alert(`Intake year must be between 2000 and ${currentYear + 1}.`);
        if (form.start_date && form.end_date && form.end_date <= form.start_date) return alert("End date must be after start date.");
        onSubmit(form);
      }}>
        <div className="form-row">
          <div className="form-group">
            <label>Class Code</label>
            <input name="class_code" value={form.class_code} onChange={handle} placeholder="SE1701" required />
          </div>
          <div className="form-group">
            <label>Class Name</label>
            <input name="class_name" value={form.class_name} onChange={handle} placeholder="Software Engineering 1701" required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Class Type</label>
            <select name="class_type" value={form.class_type} onChange={handleTypeChange}>
              <option value="MAIN" disabled={!initialData && restrictCreateToCapstone}>
                Main (10 weeks)
              </option>
              <option value="CAPSTONE" disabled={!initialData && restrictCreateToMain}>
                Capstone (3 weeks)
              </option>
            </select>
            {!initialData && restrictCreateToCapstone && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--slate-500)",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                Semester is Active: only Capstone (3 weeks) can be created.
              </span>
            )}
            {!initialData && restrictCreateToMain && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--slate-500)",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                Semester is Upcoming: only Main (10 weeks) can be created.
              </span>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Major</label>
            <select name="major" value={form.major} onChange={handle}>
              <option value="SE">Software Engineering</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="GD">Graphic Design</option>
            </select>
          </div>
          <div className="form-group">
            <label>Intake Year</label>
            <input name="intake_year" type="number" value={form.intake_year} onChange={handle} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handle} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handle} />
          </div>
        </div>
        <div className="form-group">
          <label>Lecturer</label>
          <select name="lecturer_id" value={form.lecturer_id} onChange={handle}>
            <option value="">-- Unassigned --</option>
            {(lecturers || []).map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handle}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">{initialData ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignLecturerModal({ isOpen, onClose, cls, lecturers, onAssign }) {
  const [lecturerId, setLecturerId] = useState(cls?.lecturer_id || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Lecturer - ${cls?.class_code || ""}`}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
        onAssign(cls.id, lecturerId ? Number(lecturerId) : null);
      }}>
        <div className="form-group">
          <label>Select Lecturer</label>
          <select value={lecturerId} onChange={(e) => setLecturerId(e.target.value)}>
            <option value="">- None -</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Assign</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddStudentModal({ isOpen, onClose, onSubmit, allStudents, classId, enrichedClasses }) {
  const [search, setSearch] = useState("");

  // Exclude students already in THIS class
  const currentClassStudentIds = new Set(
    enrichedClasses.find((c) => c.id === classId)?.students?.map((s) => s.id) || []
  );
  const available = allStudents.filter((s) => !currentClassStudentIds.has(s.id));
  const filtered = available.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.student_code || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  // Build a map: studentId -> className for students in other classes
  const studentClassMap = {};
  enrichedClasses.forEach((c) => {
    if (c.id !== classId && c.students) {
      c.students.forEach((s) => {
        studentClassMap[s.id] = c.class_code || c.class_name || `Class ${c.id}`;
      });
    }
  });

  const handleClick = (student) => {
    const currentClass = studentClassMap[student.id];
    if (currentClass) {
      const confirmed = window.confirm(
        `This student is currently in class "${currentClass}". Do you want to move them to this class?`
      );
      if (!confirmed) return;
    }
    onSubmit(student);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Student to Class">
      <div style={{ marginBottom: "1rem" }}>
        <input
          className="integration-input"
          placeholder="Search by name, student code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 ? (
          <span style={{ color: "var(--slate-400)", textAlign: "center", padding: "1rem" }}>
            {search ? "No matching students found." : "No students available."}
          </span>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="class-student-dropdown-item"
              style={{ cursor: "pointer", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--slate-200)" }}
              onClick={() => handleClick(s)}
            >
              <div className="avatar-small">{(s.full_name || "S")[0]}</div>
              <div className="profile-info">
                <span className="profile-name">{s.full_name}</span>
                <span className="profile-email">{s.email || "No email"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <code className="code-badge">{s.student_code}</code>
                {studentClassMap[s.id] && (
                  <span style={{ fontSize: "0.7rem", color: "var(--warning)", fontWeight: 600 }}>
                    In {studentClassMap[s.id]}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export function SemesterClassView({
  semesters,
  selectedSemesterId,
  onSelectSemester,
  enrichedClasses,
  lecturers,
  semesterModalOpen,
  editingSemester,
  onCreateSemester,
  onEditSemester,
  onCloseSemesterModal,
  onSubmitSemester,
  onDeleteSemester,
  classModalOpen,
  editingClass,
  onCreateClass,
  onEditClass,
  onCloseClassModal,
  onSubmitClass,
  onDeleteClass,
  assignModalOpen,
  assigningClass,
  onOpenAssign,
  onCloseAssignModal,
  onAssignLecturer,
  onAddStudent,
  allStudents = [],
}) {
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [addStudentClassId, setAddStudentClassId] = useState(null);
  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);
  const isSemesterActive = selectedSemester?.status?.toLowerCase() === "active";
  const isSemesterCompleted = selectedSemester?.status?.toLowerCase() === "completed";
  const isSemesterUpcoming = selectedSemester?.status?.toLowerCase() === "upcoming";

  const toggleStudents = (classId) => {
    setExpandedClassId((prev) => (prev === classId ? null : classId));
  };

  const guardCompleted = (actionLabel, fn) => {
    if (isSemesterCompleted) {
      window.alert("Semester is Completed — operations are locked");
      return;
    }
    fn?.();
  };

  return (
    <div className="semester-class-page">
      <PageHeader
        title="Semesters & Classes"
        description="Manage academic semesters and their classes. Assign lecturers to classes so students and groups can be properly organized."
        actions={<Button variant="primary" size="sm" onClick={onCreateSemester}>+ New Semester</Button>}
      />

      <div className="semester-cards mt-2">
        {semesters.map((s) => (
          <div key={s.id} className={`semester-card ${s.id === selectedSemesterId ? "semester-card--active" : ""}`} onClick={() => onSelectSemester(s.id)}>
            <div className="semester-card__header">
              <span className="semester-card__name">{s.name}</span>
              <Badge variant={s.status?.toLowerCase() === "active" ? "success" : s.status?.toLowerCase() === "upcoming" ? "warning" : "default"} size="sm">{s.status}</Badge>
            </div>
            <span className="semester-card__code">{s.code}</span>
            {s.start_date && <span className="semester-card__dates">{s.start_date} {"->"} {s.end_date}</span>}
            <div className="semester-card__actions">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditSemester(s); }}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteSemester(s.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {selectedSemester && (
        <>
          <div className="section-header mt-2">
            <h2 className="section-title">Classes in <strong>{selectedSemester.name}</strong></h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {isSemesterCompleted && (
                <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 500 }}>
                  Semester is Completed — operations are locked
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={isSemesterCompleted}
                onClick={() => guardCompleted("Create class", onCreateClass)}
              >
                + New Class
              </Button>
            </div>
          </div>

          <div className="table-container mt-1">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Class Code</th>
                  <th>Class Name</th>
                  <th>Type</th>
                  <th>Major</th>
                  <th>Lecturer</th>
                  <th>Students</th>
                  <th>Groups</th>
                  <th>Status</th>
                  <th className="action-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClasses.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "2rem", color: "var(--slate-400)" }}>
                      No classes in this semester yet. Click "+ New Class" to create one.
                    </td>
                  </tr>
                ) : (
                  enrichedClasses.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr>
                        <td><span className="code-badge">{c.class_code}</span></td>
                        <td>{c.class_name || "-"}</td>
                        <td>
                          <Badge variant={(c.class_type || "MAIN") === "CAPSTONE" ? "warning" : "info"} size="sm">
                            {(c.class_type || "MAIN") === "CAPSTONE" ? "3w" : "10w"}
                          </Badge>
                        </td>
                        <td>{c.major || "-"}</td>
                        <td>
                          <span
                            className={`lecturer-link ${c.lecturer_id ? "" : "lecturer-link--unassigned"}`}
                            onClick={() => guardCompleted("Assign lecturer", () => onOpenAssign(c))}
                            title={isSemesterCompleted ? "Semester completed" : "Click to assign/change lecturer"}
                            style={isSemesterCompleted ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
                          >
                            {c.lecturer_name}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="student-dropdown-toggle" onClick={() => toggleStudents(c.id)}>
                            <span>{c.student_count} student{c.student_count !== 1 ? "s" : ""}</span>
                            <span className={`student-dropdown-toggle__arrow ${expandedClassId === c.id ? "student-dropdown-toggle__arrow--open" : ""}`}>v</span>
                          </button>
                        </td>
                        <td>
                          {c.groups && c.groups.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                              {c.groups.map((g) => (
                                <Badge key={g.id} variant="info" size="sm" title={g.group_name}>
                                  {g.group_code || g.group_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "var(--slate-400)" }}>None</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={c.status?.toLowerCase() === "active" ? "success" : c.status?.toLowerCase() === "completed" ? "default" : "warning"} size="sm">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="action-cell">
                          <div className="action-buttons">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSemesterCompleted}
                              onClick={() => guardCompleted("Edit class", () => onEditClass(c))}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSemesterCompleted}
                              onClick={() => guardCompleted("Delete class", () => onDeleteClass(c.id))}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {expandedClassId === c.id && (
                        <tr>
                          <td colSpan="9" className="expanded-content-cell">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <span className="expanded-row-title" style={{ margin: 0 }}>Students in {c.class_code}</span>
                              {isSemesterActive ? (
                                <Button variant="primary" size="sm" onClick={() => setAddStudentClassId(c.id)}>+ Add Student</Button>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "var(--slate-400)", fontStyle: "italic" }}>
                                  Activate semester to add students
                                </span>
                              )}
                            </div>
                            {c.students && c.students.length > 0 ? (
                              <div className="class-student-dropdown-list">
                                {c.students.map((student) => (
                                  <div key={student.id} className="class-student-dropdown-item">
                                    <div className="avatar-small">{(student.full_name || "S")[0]}</div>
                                    <div className="profile-info">
                                      <span className="profile-name">{student.full_name}</span>
                                      <span className="profile-email">{student.email}</span>
                                    </div>
                                    <code className="code-badge">{student.student_code}</code>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-secondary">No students in this class yet.{isSemesterActive ? ' Click "+ Add Student" to add one.' : ""}</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {semesterModalOpen && (
        <SemesterFormModal key={editingSemester?.id || "new-sem"} isOpen={semesterModalOpen} onClose={onCloseSemesterModal} onSubmit={onSubmitSemester} initialData={editingSemester} semesters={semesters} />
      )}

      {classModalOpen && (
        <ClassFormModal
          key={editingClass?.id || "new-cls"}
          isOpen={classModalOpen}
          onClose={onCloseClassModal}
          onSubmit={onSubmitClass}
          initialData={editingClass}
          lecturers={lecturers}
          restrictCreateToCapstone={isSemesterActive}
          restrictCreateToMain={isSemesterUpcoming}
        />
      )}

      {assignModalOpen && assigningClass && (
        <AssignLecturerModal key={assigningClass.id} isOpen={assignModalOpen} onClose={onCloseAssignModal} cls={assigningClass} lecturers={lecturers} onAssign={onAssignLecturer} />
      )}

      {addStudentClassId && (
        <AddStudentModal
          isOpen={!!addStudentClassId}
          onClose={() => setAddStudentClassId(null)}
          classId={addStudentClassId}
          allStudents={allStudents}
          enrichedClasses={enrichedClasses}
          onSubmit={async (student) => {
            await onAddStudent(addStudentClassId, student);
            setAddStudentClassId(null);
          }}
        />
      )}
    </div>
  );
}


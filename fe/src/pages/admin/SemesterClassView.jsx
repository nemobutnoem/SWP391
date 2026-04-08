import React, { useRef, useState } from "react";
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
  semesterStatus = "",
  restrictCreateToCapstone = false,
}) {
  const isSemesterActive = String(semesterStatus || "").toLowerCase() === "active";
  const forceInactiveOnCreate = !initialData && (!isSemesterActive || restrictCreateToCapstone);

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
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
        }
      : {
          class_code: "",
          class_name: "",
          major: "SE",
          intake_year: new Date().getFullYear(),
          department: "",
          status: forceInactiveOnCreate ? "Inactive" : "Active",
          lecturer_id: "",
          class_type: restrictCreateToCapstone ? "CAPSTONE" : "MAIN",
          start_date: "",
          end_date: "",
        }
  );

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({
      ...p,
      class_type: val,
      ...(forceInactiveOnCreate ? { status: "Inactive" } : null),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Class" : "Create Class"}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
        if (!form.class_name || !form.class_name.trim()) return alert("Class name is required.");
        if (!initialData && restrictCreateToCapstone && form.class_type !== "CAPSTONE") {
          return alert("This semester is Active. Only Capstone (3 weeks) classes can be created.");
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
              <option value="CAPSTONE">
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
          <select name="status" value={form.status} onChange={handle} disabled={forceInactiveOnCreate}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
          {forceInactiveOnCreate && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--slate-500)",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              Status is forced to Inactive for new classes in this semester.
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
            {search
              ? "No matching students found."
              : "No students available to add. Create students in User Management first."}
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
  onCompleteClass,
  onActivateClass,
  onPreEnroll,
  allStudents = [],
  isCapstoneRunning = false,
}) {
  const semesterCardsRef = useRef(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [addStudentClassId, setAddStudentClassId] = useState(null);
  const selectedSemester = semesters.find((s) => String(s.id) === String(selectedSemesterId));
  const semesterStatus = String(selectedSemester?.status || "").trim().toLowerCase();
  const isSemesterActive = semesterStatus === "active";
  const isSemesterCompleted = semesterStatus === "completed";
  const isSemesterUpcoming = semesterStatus === "upcoming";
  const hasUncompletedMain = enrichedClasses.some(
    (c) => (c.class_type || "MAIN") === "MAIN" && String(c.status || "").toLowerCase() !== "completed"
  );

  const canEditClass = (cls) => {
    if (isSemesterCompleted) return false;
    if (!isSemesterActive) return true;
    const isCapstone = (cls.class_type || "MAIN") === "CAPSTONE";
    const isInactive = String(cls.status || "").toLowerCase() === "inactive";
    return isCapstone && isInactive;
  };

  const canDeleteClass = () => {
    if (isSemesterCompleted) return false;
    if (isSemesterActive) return false;
    return true;
  };

  const canAddStudentsToClass = (cls) => {
    if (isSemesterCompleted) return false;
    const isCapstone = (cls.class_type || "MAIN") === "CAPSTONE";
    if (isSemesterUpcoming) return !isCapstone; // Upcoming: only MAIN (10w) gets direct student assignment
    if (!isSemesterActive) return false;
    if (isCapstoneRunning) return false; // đang học 3w
    return isCapstone; // đang học 10w => chỉ được thêm cho 3w
  };

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

  const handleSemesterCardsWheel = (e) => {
    const el = semesterCardsRef.current;
    if (!el) return;
    // Only convert vertical wheel to horizontal scroll when overflow exists.
    if (el.scrollWidth <= el.clientWidth) return;
    // Respect native horizontal scrolling (trackpads) and Shift+wheel.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.shiftKey) return;

    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  const guardEditAllowed = (actionLabel, cls, fn) => {
    if (!canEditClass(cls)) {
      window.alert("You can only edit 3w (Capstone) classes while the semester is Active, and only when the 3w class is Inactive.");
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

      <div
        ref={semesterCardsRef}
        className="semester-cards mt-2"
        onWheel={handleSemesterCardsWheel}
      >
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
                  <th>Status</th>
                  <th className="action-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClasses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "var(--slate-400)" }}>
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
                            onClick={() => guardCompleted("Assign lecturer", () => guardEditAllowed("Assign lecturer", c, () => onOpenAssign(c)))}
                            title={!canEditClass(c) ? "Editing is locked (only 3w Inactive can be edited while semester is Active)" : "Click to assign/change lecturer"}
                            style={!canEditClass(c) ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
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
                          <Badge variant={c.status?.toLowerCase() === "active" ? "success" : c.status?.toLowerCase() === "completed" ? "default" : "warning"} size="sm">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="action-cell">
                          <div className="action-buttons">
                            {(() => {
                              // Quick add button (so user doesn't need to expand the students dropdown)
                              if (isSemesterCompleted) return null;
                              const rowIsCapstone = (c.class_type || "MAIN") === "CAPSTONE";

                              // Active semester, MAIN phase (capstone not running): add student means pre-enroll to 3w
                              if (isSemesterActive && !isCapstoneRunning) {
                                const capstoneTarget = rowIsCapstone
                                  ? c
                                  : (enrichedClasses.find((x) => (x.class_type || "MAIN") === "CAPSTONE" && String(x.status || "").toLowerCase() === "inactive")
                                      || enrichedClasses.find((x) => (x.class_type || "MAIN") === "CAPSTONE"));

                                if (!capstoneTarget) return null;
                                const capstoneStatus = String(capstoneTarget.status || "").toLowerCase();
                                const locked = capstoneStatus === "active";

                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={locked}
                                    title={
                                      capstoneStatus === "active"
                                        ? "Capstone (3w) is active. Enrollment is locked."
                                        : "Pre-enroll students to Capstone (3w)"
                                    }
                                    onClick={() => setAddStudentClassId(capstoneTarget.id)}
                                  >
                                    Pre-enroll
                                  </Button>
                                );
                              }

                              // Upcoming semester: add student means assign to MAIN (10w) class
                              if (isSemesterUpcoming) {
                                if (rowIsCapstone) return null;
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Add student to this 10w class"
                                    onClick={() => setAddStudentClassId(c.id)}
                                  >
                                    Add Student
                                  </Button>
                                );
                              }

                              return null;
                            })()}
                            {c.status?.toLowerCase() === "active" && isSemesterActive && (
                              <Button variant="ghost" size="sm" onClick={() => onCompleteClass(c.id)}>
                                Complete
                              </Button>
                            )}
                            {c.status?.toLowerCase() === "inactive" && isSemesterActive && (() => {
                              const isCapstone = (c.class_type || "MAIN") === "CAPSTONE";
                              const capstoneBlocked = isCapstone && hasUncompletedMain;
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={capstoneBlocked}
                                  onClick={() => onActivateClass(c.id)}
                                  title={capstoneBlocked
                                    ? "Cannot activate Capstone (3w) until all Main (10w) classes are Completed"
                                    : "Activate this class"}
                                >
                                  Activate
                                </Button>
                              );
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canEditClass(c)}
                              title={!canEditClass(c) ? "Only 3w Inactive classes can be edited while semester is Active" : "Edit"}
                              onClick={() => guardCompleted("Edit class", () => guardEditAllowed("Edit class", c, () => onEditClass(c)))}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDeleteClass()}
                              title={!canDeleteClass() ? "You can only delete classes when the semester is not Active" : "Delete"}
                              onClick={() => guardCompleted("Delete class", () => onDeleteClass(c.id))}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {expandedClassId === c.id && (
                        <tr>
                          <td colSpan="8" className="expanded-content-cell">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <span className="expanded-row-title" style={{ margin: 0 }}>Students in {c.class_code}</span>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                {(() => {
                                  const rowIsCapstone = (c.class_type || "MAIN") === "CAPSTONE";

                                  // Active semester, MAIN phase (capstone not running): add student means pre-enroll to 3w
                                  if (isSemesterActive && !isCapstoneRunning) {
                                    const capstoneTarget = rowIsCapstone
                                      ? c
                                      : (enrichedClasses.find((x) => (x.class_type || "MAIN") === "CAPSTONE" && String(x.status || "").toLowerCase() === "inactive")
                                          || enrichedClasses.find((x) => (x.class_type || "MAIN") === "CAPSTONE"));

                                    if (!capstoneTarget) {
                                      return (
                                        <span style={{ fontSize: "0.75rem", color: "var(--slate-400)", fontStyle: "italic" }}>
                                          Create a 3w (Capstone) class first to pre-enroll students.
                                        </span>
                                      );
                                    }

                                    // Only allow pre-enroll when capstone class is not Active
                                    const capstoneStatus = String(capstoneTarget.status || "").toLowerCase();
                                    if (capstoneStatus === "active") {
                                      return (
                                        <span style={{ fontSize: "0.75rem", color: "var(--slate-400)", fontStyle: "italic" }}>
                                          Capstone (3w) is active. Enrollment is locked.
                                        </span>
                                      );
                                    }

                                    return (
                                      <Button variant="secondary" size="sm" onClick={() => setAddStudentClassId(capstoneTarget.id)}>
                                        Pre-enroll to 3w
                                      </Button>
                                    );
                                  }

                                  // Upcoming semester: add student means assign to MAIN (10w) class
                                  if (isSemesterUpcoming) {
                                    const mainTarget = rowIsCapstone
                                      ? enrichedClasses.find((x) => (x.class_type || "MAIN") === "MAIN")
                                      : c;

                                    if (!mainTarget) {
                                      return (
                                        <span style={{ fontSize: "0.75rem", color: "var(--slate-400)", fontStyle: "italic" }}>
                                          Create a 10w (Main) class first to add students.
                                        </span>
                                      );
                                    }

                                    return (
                                      <Button variant="primary" size="sm" onClick={() => setAddStudentClassId(mainTarget.id)}>
                                        + Add Student
                                      </Button>
                                    );
                                  }

                                  // Fallback: locked
                                  return (
                                    <span style={{ fontSize: "0.75rem", color: "var(--slate-400)", fontStyle: "italic" }}>
                                      Adding students is locked for this semester status.
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            {(() => {
                              const isCapstone = (c.class_type || "MAIN") === "CAPSTONE";
                              const directStudents = Array.isArray(c.students) ? c.students : [];
                              const enrollmentStudents = Array.isArray(c.enrollments) ? c.enrollments : [];
                              const hasDirectStudents = directStudents.length > 0;
                              const hasEnrollmentStudents = enrollmentStudents.length > 0;
                              const isClassActive = c.status?.toLowerCase() === "active";

                              if (isCapstone) {
                                if (!hasEnrollmentStudents) {
                                  return (
                                    <span className="text-secondary">No students in this class yet.</span>
                                  );
                                }

                                return (
                                  <div className="class-student-dropdown-list">
                                    {enrollmentStudents.map((e) => (
                                      <div key={e.id} className="class-student-dropdown-item">
                                        <div className="avatar-small">{((e.student_name || e.full_name || "S")[0])}</div>
                                        <div className="profile-info">
                                          <span className="profile-name">{e.student_name || e.full_name || "-"}</span>
                                          <span className="profile-email">
                                            {e.email || e.student_email || e.studentEmail || "-"}
                                          </span>
                                        </div>
                                        <code className="code-badge">{e.student_code || e.studentCode || e.code || "-"}</code>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              if (!hasDirectStudents) {
                                return (
                                  <span className="text-secondary">No students in this class yet.</span>
                                );
                              }

                              return (
                                <div className="class-student-dropdown-list">
                                  {directStudents.map((student) => (
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
                              );
                            })()}
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
          semesterStatus={selectedSemester?.status || ""}
          restrictCreateToCapstone={isSemesterActive}
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


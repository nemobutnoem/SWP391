import React, { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import "./adminManagement.css";

function SemesterFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          code: initialData.code || "",
          name: initialData.name || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          status: initialData.status || "Active",
        }
      : { code: "", name: "", start_date: "", end_date: "", status: "Active" }
  );

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Semester" : "Create Semester"}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
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
            <input name="start_date" type="date" value={form.start_date} onChange={handle} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handle} />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handle}>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
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

function ClassFormModal({ isOpen, onClose, onSubmit, initialData, lecturers }) {
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
        }
      : { class_code: "", class_name: "", major: "SE", intake_year: new Date().getFullYear(), department: "", status: "Active", lecturer_id: "" }
  );

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Class" : "Create Class"}>
      <form className="task-form" onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}>
        <div className="form-row">
          <div className="form-group">
            <label>Class Code</label>
            <input name="class_code" value={form.class_code} onChange={handle} placeholder="SE1701" required />
          </div>
          <div className="form-group">
            <label>Class Name</label>
            <input name="class_name" value={form.class_name} onChange={handle} placeholder="Software Engineering 1701" />
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
}) {
  const [expandedClassId, setExpandedClassId] = useState(null);
  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);

  const toggleStudents = (classId) => {
    setExpandedClassId((prev) => (prev === classId ? null : classId));
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
              <Badge variant={s.status?.toLowerCase() === "active" ? "success" : "default"} size="sm">{s.status}</Badge>
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
            <Button variant="primary" size="sm" onClick={onCreateClass}>+ New Class</Button>
          </div>

          <div className="table-container mt-1">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Class Code</th>
                  <th>Class Name</th>
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
                        <td>{c.major || "-"}</td>
                        <td>
                          <span className={`lecturer-link ${c.lecturer_id ? "" : "lecturer-link--unassigned"}`} onClick={() => onOpenAssign(c)} title="Click to assign/change lecturer">
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
                          <Badge variant={c.status?.toLowerCase() === "active" ? "success" : "default"} size="sm">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="action-cell">
                          <div className="action-buttons">
                            <Button variant="ghost" size="sm" onClick={() => onEditClass(c)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteClass(c.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>

                      {expandedClassId === c.id && (
                        <tr>
                          <td colSpan="8" className="expanded-content-cell">
                            <span className="expanded-row-title">Students in {c.class_code}</span>
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
                              <span className="text-secondary">No students in this class yet.</span>
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
        <SemesterFormModal key={editingSemester?.id || "new-sem"} isOpen={semesterModalOpen} onClose={onCloseSemesterModal} onSubmit={onSubmitSemester} initialData={editingSemester} />
      )}

      {classModalOpen && (
        <ClassFormModal key={editingClass?.id || "new-cls"} isOpen={classModalOpen} onClose={onCloseClassModal} onSubmit={onSubmitClass} initialData={editingClass} lecturers={lecturers} />
      )}

      {assignModalOpen && assigningClass && (
        <AssignLecturerModal key={assigningClass.id} isOpen={assignModalOpen} onClose={onCloseAssignModal} cls={assigningClass} lecturers={lecturers} onAssign={onAssignLecturer} />
      )}
    </div>
  );
}


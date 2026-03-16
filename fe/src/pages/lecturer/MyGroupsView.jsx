import React, { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import "../admin/adminManagement.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function MyGroupsView({
  enrichedGroups,
  expandedGroupId,
  onToggleExpand,
  semesterOptions = [],
  classOptions = [],
  selectedSemesterId,
  selectedClassId,
  onSemesterChange,
  onClassChange,
  onRoleChange,
  onAddMember,
  onRemoveMember,
  addMemberGroupId,
  onOpenAddMember,
  onCloseAddMember,
  availableStudents,
  topics = [],
  topicSelections = {},
  onTopicSelectionChange,
  onAssignTopic,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Member");

  const filteredStudents = availableStudents.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.student_code || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = (studentId) => {
    onAddMember(addMemberGroupId, studentId, selectedRole);
  };
  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="My Supervised Groups"
        description="Detailed view of all groups under your supervision with member contribution scores and grade history."
      />

      <div className="filters-row groups-filters-row">
        <select
          className="form-select groups-filter-select"
          value={selectedSemesterId ?? ""}
          onChange={(e) => onSemesterChange?.(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Semesters</option>
          {semesterOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code || s.name || `Semester #${s.id}`}
            </option>
          ))}
        </select>

        <select
          className="form-select groups-filter-select"
          value={selectedClassId ?? ""}
          onChange={(e) => onClassChange?.(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Classes</option>
          {classOptions
            .filter((c) => !selectedSemesterId || c.semester_id === selectedSemesterId || c.semesterId === selectedSemesterId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_code || c.classCode || `Class #${c.id}`}
              </option>
            ))}
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Topic</th>
              <th>Members</th>
              <th>Avg. Score</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {enrichedGroups.map((g) => (
              <React.Fragment key={g.id}>
                <tr
                  className="row-expandable"
                  onClick={() => onToggleExpand(g.id)}
                >
                  <td>
                    <div className="group-project-cell">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{expandedGroupId === g.id ? "📂" : "📁"}</span>
                        <span className="group-name">{g.group_name}</span>
                      </div>
                      <div className="group-meta">{g.description}</div>
                    </div>
                  </td>
                  <td>
                    {g.topicName ? (
                      <Badge variant="neutral" size="sm">{g.topicName}</Badge>
                    ) : (
                      <span className="text-secondary">No topic assigned</span>
                    )}
                  </td>
                  <td>
                    <Badge variant="info" size="sm">
                      {g.members.length} members
                    </Badge>
                  </td>
                  <td>
                    {g.avgScore ? (
                      <strong style={{ color: "var(--brand-700)" }}>
                        {g.avgScore} / 10
                      </strong>
                    ) : (
                      <span className="text-secondary">No grades yet</span>
                    )}
                  </td>
                  <td>
                    {g.groupGrades.filter((gr) => gr.status === "PENDING").length > 0 ? (
                      <Badge variant="warning" size="sm">
                        {g.groupGrades.filter((gr) => gr.status === "PENDING").length} pending
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">All graded</Badge>
                    )}
                  </td>
                </tr>

                {expandedGroupId === g.id && (
                  <tr className="expanded-row">
                    <td colSpan="5" className="expanded-content-cell">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        <div style={{ minWidth: "320px", flex: "1 1 360px" }}>
                          <span className="expanded-row-title" style={{ display: "block", marginBottom: "0.5rem" }}>
                            Assigned Topic
                          </span>
                          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                            <select
                              className="form-select"
                              value={topicSelections[g.id] ?? ""}
                              onChange={(e) => onTopicSelectionChange?.(g.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ minWidth: "260px" }}
                            >
                              <option value="">Select topic...</option>
                              {topics.map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.name} ({topic.code})
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignTopic?.(g.id);
                              }}
                            >
                              Save Topic
                            </Button>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", minWidth: "180px" }}>
                          <div className="text-secondary" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                            Current topic
                          </div>
                          <div style={{ fontWeight: 700 }}>
                            {g.topicName || "Not assigned"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="expanded-row-title">Member Contribution Scores</span>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", borderRadius: "6px", border: "none", background: "var(--brand-600, #2563eb)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                          onClick={(e) => { e.stopPropagation(); onOpenAddMember(g.id); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
                          </svg>
                          Add Student
                        </button>
                      </div>
                      <table className="admin-table" style={{ marginTop: "0.75rem" }}>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Student Code</th>
                            <th>Role</th>
                            <th>GitHub</th>
                            <th style={{ width: "60px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.members.map((m) => (
                            <tr key={m.member_id}>
                              <td>
                                <div className="user-profile-cell">
                                  <div className="avatar-small">{m.full_name?.[0]}</div>
                                  <span className="profile-name">{m.full_name}</span>
                                </div>
                              </td>
                              <td>
                                <code className="code-badge">{m.student_code}</code>
                              </td>
                              <td>
                                <select
                                  className="form-select"
                                  value={m.role_in_group}
                                  onChange={(e) => onRoleChange(m.member_id, e.target.value)}
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem", width: "auto" }}
                                >
                                  <option value="Leader">LEADER</option>
                                  <option value="Member">MEMBER</option>
                                </select>
                              </td>
                              <td>
                                <span className="text-secondary">@{m.github_username}</span>
                              </td>
                              <td>
                                <button
                                  title="Remove member"
                                  onClick={(e) => { e.stopPropagation(); onRemoveMember(g.id, m.member_id); }}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red-500, #ef4444)", padding: "0.25rem", borderRadius: "4px", display: "flex", alignItems: "center" }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {g.groupGrades.length > 0 && (
                        <>
                          <span className="expanded-row-title" style={{ marginTop: "1.5rem", display: "block" }}>
                            Grade History
                          </span>
                          <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                            {g.groupGrades.map((gr) => (
                              <div
                                key={gr.id}
                                style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", minWidth: "200px" }}
                              >
                                <div style={{ fontWeight: 700, fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                                  {gr.milestone}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
                                  {gr.date}
                                </div>
                                {gr.score !== null ? (
                                  <div style={{ marginTop: "0.5rem", fontWeight: 800, fontSize: "1.25rem", color: "var(--brand-700)" }}>
                                    {gr.score} / 10
                                  </div>
                                ) : (
                                  <Badge variant="warning" size="sm" style={{ marginTop: "0.5rem" }}>
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={addMemberGroupId !== null}
        onClose={() => { onCloseAddMember(); setSearchTerm(""); }}
        title="Add Student to Group"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by name, student code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1px solid var(--slate-300, #cbd5e1)", borderRadius: "6px", fontSize: "0.875rem" }}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--slate-300, #cbd5e1)", borderRadius: "6px", fontSize: "0.875rem" }}
            >
              <option value="Member">MEMBER</option>
              <option value="Leader">LEADER</option>
            </select>
          </div>

          <div style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid var(--slate-200, #e2e8f0)", borderRadius: "8px" }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--slate-500, #64748b)", fontSize: "0.875rem" }}>
                {searchTerm ? "No students found matching your search." : "No available students to add."}
              </div>
            ) : (
              <table className="admin-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student Code</th>
                    <th>Email</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="avatar-small">{s.full_name?.[0]}</div>
                          <span className="profile-name">{s.full_name}</span>
                        </div>
                      </td>
                      <td><code className="code-badge">{s.student_code}</code></td>
                      <td><span className="text-secondary">{s.email}</span></td>
                      <td>
                        <button
                          onClick={() => handleAdd(s.id)}
                          style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem", borderRadius: "5px", border: "none", background: "var(--brand-600, #2563eb)", color: "white", cursor: "pointer", fontWeight: 500 }}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}

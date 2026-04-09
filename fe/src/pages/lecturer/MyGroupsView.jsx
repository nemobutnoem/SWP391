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
  onCreateGroup,
  onFetchGroupData,
  fetchingGroupId = null,
  fetchStatusByGroupId = {},
  isSemesterActive = true,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Member");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [createGroupForm, setCreateGroupForm] = useState({
    group_code: "",
    group_name: "",
    description: "",
  });

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

  const openCreateGroupModal = () => {
    if (!selectedSemesterId || !selectedClassId) {
      window.alert("Please select a semester and class before creating a group.");
      return;
    }
    setCreateGroupForm({
      group_code: "",
      group_name: "",
      description: "",
    });
    setIsCreateGroupOpen(true);
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    await onCreateGroup?.({
      ...createGroupForm,
      group_code: createGroupForm.group_code.trim(),
      group_name: createGroupForm.group_name.trim(),
      description: createGroupForm.description.trim(),
    });
    setIsCreateGroupOpen(false);
  };

  const getClassTypeForGroup = (group) => {
    const classId = group?.class_id ?? group?.classId;
    const clazz = (Array.isArray(classOptions) ? classOptions : []).find((c) => Number(c.id) === Number(classId));
    const type = String(clazz?.class_type ?? clazz?.classType ?? "MAIN").toUpperCase();
    return type === "CAPSTONE" ? "CAPSTONE" : "MAIN";
  };

  const getSemesterIdForGroup = (group) => String(group?.semester_id ?? group?.semesterId ?? "");

  const getScopedTopicsForGroup = (group) => {
    const semId = getSemesterIdForGroup(group);
    const classType = getClassTypeForGroup(group);
    return (Array.isArray(topics) ? topics : []).filter((t) => {
      const tSem = String(t?.semester_id ?? t?.semesterId ?? "");
      const tBlock = String(t?.block_type ?? t?.blockType ?? "MAIN").toUpperCase();
      return (!semId || tSem === semId) && (tBlock === classType);
    });
  };

  const selectableClassOptions = (Array.isArray(classOptions) ? classOptions : [])
    .filter((c) => !selectedSemesterId || c.semester_id === selectedSemesterId || c.semesterId === selectedSemesterId);

  const formatClassOptionLabel = (clazz) => {
    const code = clazz?.class_code || clazz?.classCode || `Class #${clazz?.id}`;
    const block = String(clazz?.class_type || clazz?.classType || "MAIN").toUpperCase() === "CAPSTONE"
      ? "Block 3"
      : "Block 10";
    const status = String(clazz?.status || "Inactive").toLowerCase() === "active"
      ? "Active"
      : "Inactive";
    return `${code} - ${block} - ${status}`;
  };

  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="My Supervised Groups"
        description="Detailed view of all groups under your supervision with member contribution scores and grade history."
        actions={
          <Button variant="primary" size="sm" onClick={openCreateGroupModal} disabled={!isSemesterActive}>
            Create Group
          </Button>
        }
      />

      <div className="filters-row groups-filters-row">
        <select
          className="form-select groups-filter-select"
          value={selectedSemesterId ?? ""}
          onChange={(e) => onSemesterChange?.(e.target.value ? Number(e.target.value) : null)}
        >
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
          {selectableClassOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {formatClassOptionLabel(c)}
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
                      {/* Lock banner for completed groups */}
                      {(!isSemesterActive || g.status?.toLowerCase() === "completed") && (
                        <div style={{ padding: "0.625rem 1rem", marginBottom: "1rem", borderRadius: "8px", background: "var(--slate-100, #f1f5f9)", border: "1px solid var(--slate-300)", color: "var(--slate-600)", fontSize: "0.85rem", fontWeight: 500 }}>
                          {!isSemesterActive ? "Semester is not active. All operations are locked." : "This group is completed. All operations are locked."}
                        </div>
                      )}
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
                              disabled={!isSemesterActive || g.status?.toLowerCase() === "completed"}
                            >
                              <option value="">Select topic...</option>
                              {getScopedTopicsForGroup(g).map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.name} ({topic.code})
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={!isSemesterActive || g.status?.toLowerCase() === "completed"}
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
                        <div>
                          <span className="expanded-row-title">Member Contribution Scores</span>
                          {g.hasContributionData && (
                            <div className="text-secondary" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                              Auto-calculated from Jira story points
                            </div>
                          )}
                          {!g.hasContributionData && (
                            <div className="text-secondary" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                              No contribution data yet. Add story points in Jira to calculate member percentages.
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {fetchStatusByGroupId?.[g.id]?.text && (
                            <div
                              className="text-secondary"
                              style={{
                                fontSize: "0.75rem",
                                alignSelf: "center",
                                color:
                                  fetchStatusByGroupId[g.id].type === "error"
                                    ? "var(--red-600, #dc2626)"
                                    : "var(--slate-500, #64748b)",
                              }}
                            >
                              {fetchStatusByGroupId[g.id].text}
                            </div>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--slate-300, #cbd5e1)", background: "white", color: "var(--slate-700, #334155)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                            disabled={fetchingGroupId === g.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFetchGroupData?.(g.id);
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={fetchingGroupId === g.id ? "jira-refresh-spin" : ""}
                            >
                              <path d="M8 1.5a6.5 6.5 0 0 1 5.11 10.52.75.75 0 1 1-1.18-.92A5 5 0 1 0 8 13a4.98 4.98 0 0 0 3.03-1.02.75.75 0 1 1 .9 1.2A6.5 6.5 0 1 1 8 1.5Zm4.75.5a.75.75 0 0 1 .75.75V6a.75.75 0 0 1-1.5 0V4.56l-1.22 1.22a.75.75 0 1 1-1.06-1.06l2.5-2.5A.75.75 0 0 1 12.75 2Z" />
                            </svg>
                            {fetchingGroupId === g.id ? "Fetching..." : "Fetch Data"}
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", borderRadius: "6px", border: "none", background: "var(--brand-600, #2563eb)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                            onClick={(e) => { e.stopPropagation(); onOpenAddMember(g.id); }}
                            disabled={!isSemesterActive || g.status?.toLowerCase() === "completed"}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
                            </svg>
                            Add Student
                          </button>
                        </div>
                      </div>
                      <table className="admin-table" style={{ marginTop: "0.75rem" }}>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Student Code</th>
                            <th>Group Role</th>
                            <th>Contribution</th>
                            <th>GitHub</th>
                            <th style={{ width: "60px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.members.map((m) => (
                            <tr key={m.member_id} className={m.isDropped ? "dropped-member-row" : ""} style={m.isDropped ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(0.7)" } : {}}>
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
                                  onChange={(e) => onRoleChange(g.id, m.member_id, e.target.value)}
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem", width: "auto" }}
                                  disabled={!isSemesterActive || g.status?.toLowerCase() === "completed"}
                                >
                                  <option value="Leader">LEADER</option>
                                  <option value="Member">MEMBER</option>
                                </select>
                              </td>
                              <td>
                                {m.contribution_pct != null ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <strong style={{ color: "var(--brand-700)" }}>{m.contribution_pct}%</strong>
                                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                                      {m.member_story_points} SP
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-secondary">-</span>
                                )}
                              </td>
                              <td>
                                <span className="text-secondary">{m.github_username ? `@${m.github_username}` : "-"}</span>
                              </td>
                              <td>
                                <button
                                  title={m.isDropped ? "Đã đánh rớt" : (!isSemesterActive || g.status?.toLowerCase() === "completed") ? "Operations locked" : "Đánh rớt sinh viên"}
                                  disabled={m.isDropped || !isSemesterActive || g.status?.toLowerCase() === "completed"}
                                  onClick={(e) => { e.stopPropagation(); onRemoveMember(g.id, m.member_id); }}
                                  style={{ background: "none", border: "none", cursor: m.isDropped ? "not-allowed" : "pointer", color: m.isDropped ? "#aaa" : "var(--red-500, #ef4444)", padding: "0.25rem", borderRadius: "4px", display: "flex", alignItems: "center" }}
                                >
                                  {/* icon: fa-ban (cấm/đánh rớt) */}
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {!g.hasContributionData && (
                        <div
                          style={{
                            marginTop: "0.875rem",
                            padding: "0.875rem 1rem",
                            borderRadius: "8px",
                            background: "var(--slate-50, #f8fafc)",
                            border: "1px dashed var(--slate-300, #cbd5e1)",
                            color: "var(--slate-600, #475569)",
                            fontSize: "0.875rem",
                          }}
                        >
                          No story points yet. Member contribution percentage will appear automatically after Jira tasks are assigned story points.
                        </div>
                      )}

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
              aria-label="Group role"
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

      <Modal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        title="Create Group"
      >
        <form onSubmit={handleCreateGroupSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Group Code</label>
            <input
              type="text"
              value={createGroupForm.group_code}
              onChange={(e) =>
                setCreateGroupForm((prev) => ({ ...prev, group_code: e.target.value }))
              }
              placeholder="E.g. G01"
              required
              style={{ padding: "0.625rem 0.75rem", border: "1px solid var(--slate-300, #cbd5e1)", borderRadius: "6px" }}
            />
          </div>

          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Group Name</label>
            <input
              type="text"
              value={createGroupForm.group_name}
              onChange={(e) =>
                setCreateGroupForm((prev) => ({ ...prev, group_name: e.target.value }))
              }
              placeholder="E.g. Group 1"
              required
              style={{ padding: "0.625rem 0.75rem", border: "1px solid var(--slate-300, #cbd5e1)", borderRadius: "6px" }}
            />
          </div>

          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Description</label>
            <textarea
              value={createGroupForm.description}
              onChange={(e) =>
                setCreateGroupForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Short note about this group..."
              rows={3}
              style={{ padding: "0.625rem 0.75rem", border: "1px solid var(--slate-300, #cbd5e1)", borderRadius: "6px", resize: "vertical" }}
            />
          </div>

          <div className="text-secondary" style={{ fontSize: "0.8125rem" }}>
            Group will be created for the currently selected semester and class.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button variant="ghost" type="button" onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

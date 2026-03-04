import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "../admin/adminManagement.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function MyGroupsView({ enrichedGroups, expandedGroupId, onToggleExpand }) {
  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="My Supervised Groups"
        description="Detailed view of all groups under your supervision with member contribution scores and grade history."
      />

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group</th>
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
                    <td colSpan="4" className="expanded-content-cell">
                      <span className="expanded-row-title">Member Contribution Scores</span>
                      <table className="admin-table" style={{ marginTop: "0.75rem" }}>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Student Code</th>
                            <th>Role</th>
                            <th>Contribution Score</th>
                            <th>GitHub</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.members.map((m) => (
                            <tr key={m.id}>
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
                                <Badge
                                  variant={m.role_in_group === "Leader" ? "primary" : "default"}
                                  size="sm"
                                >
                                  {m.role_in_group}
                                </Badge>
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <div style={{ width: "80px", height: "6px", background: "var(--slate-200)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: `${(m.contribution_score / 10) * 100}%`,
                                        height: "100%",
                                        background:
                                          m.contribution_score >= 9
                                            ? "var(--success-500)"
                                            : m.contribution_score >= 7
                                              ? "var(--brand-500)"
                                              : "var(--warning-500)",
                                        borderRadius: "3px",
                                      }}
                                    />
                                  </div>
                                  <strong>{m.contribution_score}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="text-secondary">@{m.github_username}</span>
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
    </div>
  );
}

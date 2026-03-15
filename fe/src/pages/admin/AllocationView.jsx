import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import "./adminManagement.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function AllocationView({
  semesters,
  classes,
  selectedSemesterId,
  selectedClassId,
  onSemesterChange,
  onClassChange,
  enrichedGroups,
  topics,
  expandedGroupId,
  onToggleExpand,
  onAllocationChange,
  onConfirmAllocation,
}) {
  return (
    <div className="allocation-page">
      <PageHeader
        title="Group Allocation"
        description="Strategic coordination of project groups. Link teams to topics and supervisors while monitoring workload balance."
        actions={
          <Button variant="secondary" size="sm">
            Auto-Allocate
          </Button>
        }
      />

      <div className="allocation-stats mt-2">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div className="stat-card-mini" style={{ padding: "0.5rem 1rem", minWidth: "180px" }}>
            <span className="mini-label">Semester</span>
            <select
              className="filter-select mt-1 w-full"
              value={selectedSemesterId}
              onChange={(e) => onSemesterChange(e.target.value)}
            >
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
            </select>
          </div>
          <div className="stat-card-mini" style={{ padding: "0.5rem 1rem", minWidth: "180px" }}>
            <span className="mini-label">Class</span>
            <select
              className="filter-select mt-1 w-full"
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              disabled={!selectedSemesterId}
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_code} - {c.class_name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div className="stat-card-mini">
            <span className="mini-label">Total Groups (Filtered)</span>
            <span className="mini-value">{enrichedGroups.length}</span>
          </div>
          <div className="stat-card-mini">
            <span className="mini-label">Allocated Topics</span>
            <span className="mini-value">
              {enrichedGroups.filter((g) => g.project_id).length} / {enrichedGroups.length}
            </span>
          </div>
        </div>
      </div>

      <div className="table-container mt-2">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group Identity</th>
              <th>Project Topic</th>
              <th>Lecturer</th>
              <th>Status</th>
              <th className="action-cell">Actions</th>
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
                    <div className="group-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.125rem" }}>
                          {expandedGroupId === g.id ? "📂" : "📁"}
                        </span>
                        <span className="group-name">{g.group_name}</span>
                      </div>
                      <span className="group-meta">{g.members.length} Members</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="table-select"
                      value={g.project_id || ""}
                      onChange={(e) => onAllocationChange(g.id, 'project_id', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Select Topic...</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span style={{ color: g.class_lecturer_name ? "inherit" : "#999", fontStyle: g.class_lecturer_name ? "normal" : "italic" }}>
                      {g.class_lecturer_name || "No class lecturer"}
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant={g.project_id ? "success" : "warning"}
                      size="sm"
                    >
                      {g.project_id ? "Ready" : "Pending Topic"}
                    </Badge>
                  </td>
                  <td className="action-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmAllocation(g);
                      }}
                    >
                      Confirm
                    </Button>
                  </td>
                </tr>

                {expandedGroupId === g.id && (
                  <tr className="expanded-row">
                    <td colSpan="5" className="expanded-content-cell">
                      <span className="expanded-row-title">Group Membership Detail</span>
                      <div className="members-list">
                        {g.members.map((m) => (
                          <div
                            key={m.id}
                            className={`member-pill ${m.role_in_group === "Leader" ? "member-pill--leader" : ""}`}
                          >
                            <span>{m.role_in_group === "Leader" ? "👑" : "👤"}</span>
                            <span>{m.full_name}</span>
                            <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>
                              ({m.student_code})
                            </span>
                          </div>
                        ))}
                      </div>
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

import React, { useState, useMemo } from "react";
import {
  getGroups,
  getTopics,
  getLecturers,
  getGroupMembers,
  getStudents,
} from "../../services/mockDb.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import "./adminManagement.css";

export function AllocationPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const groups = useMemo(() => getGroups(), []);
  const topics = useMemo(() => getTopics(), []);
  const lecturers = useMemo(() => getLecturers(), []);
  const members = useMemo(() => getGroupMembers(), []);
  const students = useMemo(() => getStudents(), []);

  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const groupMembers = members
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          return { ...m, ...student };
        });

      const topic = topics.find((t) => t.id === g.project_id);

      return {
        ...g,
        members: groupMembers,
        topic_name: topic?.name || "Unassigned",
      };
    });
  }, [groups, members, students, topics]);

  const toggleExpand = (id) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

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
        <div className="stat-card-mini">
          <span className="mini-label">Total Groups</span>
          <span className="mini-value">{groups.length}</span>
        </div>
        <div className="stat-card-mini">
          <span className="mini-label">Allocated Topics</span>
          <span className="mini-value">
            {groups.filter((g) => g.project_id).length} / {groups.length}
          </span>
        </div>
        <div className="stat-card-mini">
          <span className="mini-label">Supervisors</span>
          <span className="mini-value">{lecturers.length}</span>
        </div>
      </div>

      <div className="table-container mt-2">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group Identity</th>
              <th>Project Topic</th>
              <th>Supervisor</th>
              <th>Status</th>
              <th className="action-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrichedGroups.map((g) => (
              <React.Fragment key={g.id}>
                <tr
                  className="row-expandable"
                  onClick={() => toggleExpand(g.id)}
                >
                  <td>
                    <div className="group-info">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "1.125rem" }}>
                          {expandedGroupId === g.id ? "📂" : "📁"}
                        </span>
                        <span className="group-name">{g.group_name}</span>
                      </div>
                      <span className="group-meta">
                        {g.members.length} Members
                      </span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="table-select"
                      defaultValue={g.project_id || ""}
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
                    <select
                      className="table-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Assign Lecturer...</option>
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.full_name}
                        </option>
                      ))}
                    </select>
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
                        alert(
                          `Successfully allocated Topic and Supervisor for group: ${g.group_name}`,
                        );
                      }}
                    >
                      Confirm
                    </Button>
                  </td>
                </tr>
                {expandedGroupId === g.id && (
                  <tr className="expanded-row">
                    <td colSpan="5" className="expanded-content-cell">
                      <span className="expanded-row-title">
                        Group Membership Detail
                      </span>
                      <div className="members-list">
                        {g.members.map((m) => (
                          <div
                            key={m.id}
                            className={`member-pill ${m.role_in_group === "Leader" ? "member-pill--leader" : ""}`}
                          >
                            <span>
                              {m.role_in_group === "Leader" ? "👑" : "👤"}
                            </span>
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

import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function ActivityView({
  activities,
  branches,
  actors,
  branchFilter,
  actorFilter,
  onBranchFilterChange,
  onActorFilterChange,
  getStudentName,
}) {
  return (
    <div className="activity-page">
      <PageHeader
        title="Code Activities"
        description="A real-time timeline of repository activity. Monitor commits and pushes from all group members."
      />

      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Branch</label>
          <select
            className="filter-select"
            value={branchFilter}
            onChange={(e) => onBranchFilterChange(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b === "all" ? "All Branches" : b}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Contributor</label>
          <select
            className="filter-select"
            value={actorFilter}
            onChange={(e) => onActorFilterChange(e.target.value)}
          >
            {actors.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Contributors" : getStudentName(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="empty-state">
            No activities found matching filters.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div
                className={`activity-dot activity-dot--${activity.activity_type}`}
              />

              <div className="activity-card">
                <div className="activity-header">
                  <div className="header-left">
                    <Badge variant="primary" size="sm">
                      {activity.activity_type.toUpperCase()}
                    </Badge>
                    <span className="activity-user">
                      <strong>
                        {getStudentName(activity.github_username)}
                      </strong>
                      <span className="text-slate-400 ml-1">
                        (@{activity.github_username})
                      </span>
                    </span>
                  </div>
                  <span className="activity-time">
                    {new Date(activity.occurred_at).toLocaleString()}
                  </span>
                </div>

                <div className="activity-content">
                  <p className="activity-msg">{activity.commit_message}</p>
                </div>

                <div className="activity-footer">
                  <div className="activity-ref">
                    <span className="ref-icon">🌿</span>
                    <code>{activity.ref_name || "main"}</code>
                  </div>
                  {activity.commit_sha && (
                    <div className="activity-sha">
                      <code>{activity.commit_sha.substring(0, 7)}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

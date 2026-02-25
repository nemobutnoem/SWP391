import React, { useMemo, useState } from "react";
import {
  getGithubActivities,
  getStudents,
} from "../../services/mockDb.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./activity.css";

export function ActivityPage() {
  const allActivities = useMemo(() => getGithubActivities(), []);
  const allStudents = useMemo(() => getStudents(), []);

  const [branchFilter, setBranchFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const branches = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.ref_name || "main"))],
    [allActivities],
  );

  const actors = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.github_username))],
    [allActivities],
  );

  const getStudentName = (githubUser) => {
    const s = allStudents.find((st) => st.github_username === githubUser);
    return s ? s.full_name : githubUser;
  };

  const filtered = useMemo(() => {
    return allActivities.filter((a) => {
      const branchOk =
        branchFilter === "all" || (a.ref_name || "main") === branchFilter;
      const actorOk =
        actorFilter === "all" || a.github_username === actorFilter;
      return branchOk && actorOk;
    });
  }, [allActivities, branchFilter, actorFilter]);

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
            onChange={(e) => setBranchFilter(e.target.value)}
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
            onChange={(e) => setActorFilter(e.target.value)}
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
        {filtered.length === 0 ? (
          <div className="empty-state">
            No activities found matching filters.
          </div>
        ) : (
          filtered.map((activity) => (
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

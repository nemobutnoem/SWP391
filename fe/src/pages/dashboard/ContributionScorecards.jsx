import React, { useMemo } from "react";
import "./contributionScorecards.css";

export function ContributionScorecards({ activities = [] }) {
  // Aggregate data by user
  const stats = useMemo(() => {
    return activities.reduce((acc, act) => {
      const user = act.github_username;
      if (!acc[user]) acc[user] = { commits: 0, additions: 0, deletions: 0 };
      acc[user].commits += 1;
      // Using deterministic mock data based on commit count/index to keep it pure
      acc[user].additions = acc[user].commits * 45;
      acc[user].deletions = acc[user].commits * 12;
      return acc;
    }, {});
  }, [activities]);

  return (
    <div className="scorecards-container">
      {Object.entries(stats).map(([user, data]) => (
        <div key={user} className="scorecard">
          <div className="scorecard-header">
            <div className="user-info">
              <div className="avatar-mini">{user[0].toUpperCase()}</div>
              <span className="user-handle">@{user}</span>
            </div>
            <div className="rank-badge">Top Contributor</div>
          </div>
          <div className="scorecard-stats">
            <div className="stat-box">
              <span className="stat-label">Commits</span>
              <span className="stat-val">{data.commits}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Additions</span>
              <span className="stat-val stat-val--add">+{data.additions}</span>
            </div>
          </div>
          <div className="scorecard-footer">
            <div className="progress-mini">
              <div className="progress-mini-bar" style={{ width: "75%" }}></div>
            </div>
            <span className="progress-text">Active developer</span>
          </div>
        </div>
      ))}
    </div>
  );
}

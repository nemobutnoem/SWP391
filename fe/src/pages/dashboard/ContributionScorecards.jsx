import React, { useMemo } from "react";
import "./contributionScorecards.css";

export function ContributionScorecards({ activities = [] }) {
  const { entries, maxCommits } = useMemo(() => {
    const map = activities.reduce((acc, act) => {
      const user = act.github_username;
      if (!user) return acc;
      if (!acc[user]) acc[user] = { commits: 0, additions: 0, deletions: 0 };
      acc[user].commits += 1;
      acc[user].additions += act.additions || 0;
      acc[user].deletions += act.deletions || 0;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1].commits - a[1].commits);
    const max = sorted.length > 0 ? sorted[0][1].commits : 1;
    return { entries: sorted, maxCommits: max };
  }, [activities]);

  if (entries.length === 0) return null;

  return (
    <div className="scorecards-container">
      {entries.map(([user, data], idx) => {
        const pct = Math.round((data.commits / maxCommits) * 100);
        return (
          <div key={user} className="scorecard">
            <div className="scorecard-header">
              <div className="user-info">
                <div className="avatar-mini">{user[0].toUpperCase()}</div>
                <span className="user-handle">@{user}</span>
              </div>
              {idx === 0 && <div className="rank-badge">Top Contributor</div>}
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
              <div className="stat-box">
                <span className="stat-label">Deletions</span>
                <span className="stat-val stat-val--del">-{data.deletions}</span>
              </div>
            </div>
            <div className="scorecard-footer">
              <div className="progress-mini">
                <div className="progress-mini-bar" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="progress-text">{pct}% of top committer</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

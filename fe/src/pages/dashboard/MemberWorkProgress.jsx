import React, { useMemo } from "react";
import "./memberWorkProgress.css";

export function MemberWorkProgress({ tasks = [], activities = [] }) {
  // ── Git stats per user (deduplicated by commit_sha) ──
  const gitMembers = useMemo(() => {
    const seen = new Set();
    const unique = activities.filter((a) => {
      if (!a.commit_sha || seen.has(a.commit_sha)) return false;
      seen.add(a.commit_sha);
      return true;
    });
    const map = {};
    for (const act of unique) {
      const user = act.github_username;
      if (!user) continue;
      if (!map[user]) map[user] = { commits: 0, additions: 0, deletions: 0 };
      map[user].commits += 1;
      map[user].additions += act.additions || 0;
      map[user].deletions += act.deletions || 0;
    }
    return Object.entries(map)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.commits - a.commits);
  }, [activities]);

  // ── Jira task stats per assignee ──
  const jiraMembers = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const name =
        t.assigneeName ||
        t._raw?.assigneeName ||
        t._raw?.assignee_name ||
        "Unassigned";
      if (name === "Unassigned") continue;
      if (!map[name])
        map[name] = { total: 0, done: 0, inProgress: 0, todo: 0, overdue: 0 };
      map[name].total += 1;
      const st = t.status || "TODO";
      if (st === "DONE") map[name].done += 1;
      else if (st === "IN_PROGRESS" || st === "IN_REVIEW")
        map[name].inProgress += 1;
      else map[name].todo += 1;
      if (st !== "DONE" && t.dueDate) {
        const d = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) map[name].overdue += 1;
      }
    }
    return Object.entries(map)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.done - a.done);
  }, [tasks]);

  const totalCommits = gitMembers.reduce((s, m) => s + m.commits, 0);
  const totalTasks = jiraMembers.reduce((s, m) => s + m.total, 0);
  const maxCommits = gitMembers.length > 0 ? gitMembers[0].commits : 1;

  if (gitMembers.length === 0 && jiraMembers.length === 0) return null;

  return (
    <div className="mwp">
      <h2 className="section-title">👥 Member Work Progress</h2>

      <div className="mwp-split">
        {/* ──────── JIRA TASKS TABLE ──────── */}
        <div className="mwp-panel">
          <div className="mwp-panel-header">
            <span className="mwp-panel-icon mwp-panel-icon--jira">📋</span>
            <span className="mwp-panel-title">Jira Tasks</span>
            <span className="mwp-panel-badge">{totalTasks} tasks</span>
          </div>

          {jiraMembers.length === 0 ? (
            <div className="mwp-empty">No assigned tasks</div>
          ) : (
            <div className="mwp-table">
              <div className="mwp-table-head mwp-grid--jira">
                <span className="mwp-col">Member</span>
                <span className="mwp-col">Completion</span>
                <span className="mwp-col">Breakdown</span>
                <span className="mwp-col">Status</span>
              </div>

              {jiraMembers.map((m) => {
                const initial = m.name[0]?.toUpperCase() || "?";
                const donePct = Math.round((m.done / m.total) * 100);
                const hasOverdue = m.overdue > 0;

                let statusLabel, statusClass;
                if (donePct === 100) {
                  statusLabel = "Completed";
                  statusClass = "mwp-status--done";
                } else if (hasOverdue) {
                  statusLabel = `${m.overdue} Overdue`;
                  statusClass = "mwp-status--overdue";
                } else if (m.inProgress > 0) {
                  statusLabel = "Working";
                  statusClass = "mwp-status--working";
                } else {
                  statusLabel = "Not Started";
                  statusClass = "mwp-status--idle";
                }

                return (
                  <div key={m.name} className="mwp-row mwp-grid--jira">
                    <div className="mwp-col mwp-col--member">
                      <div className="mwp-avatar mwp-avatar--jira">{initial}</div>
                      <span className="mwp-name">{m.name}</span>
                    </div>

                    <div className="mwp-col mwp-col--task">
                      <div className="mwp-bar-wrap">
                        <div className="mwp-bar">
                          <div
                            className="mwp-bar-fill mwp-bar-fill--done"
                            style={{ width: `${(m.done / m.total) * 100}%` }}
                          />
                          <div
                            className="mwp-bar-fill mwp-bar-fill--progress"
                            style={{ width: `${(m.inProgress / m.total) * 100}%` }}
                          />
                        </div>
                        <span className="mwp-pct">{donePct}%</span>
                      </div>
                    </div>

                    <div className="mwp-col mwp-col--breakdown">
                      <div className="mwp-breakdown">
                        <span className="mwp-bd-item mwp-bd--done" title="Done">✓ {m.done}</span>
                        <span className="mwp-bd-item mwp-bd--progress" title="In Progress">◐ {m.inProgress}</span>
                        <span className="mwp-bd-item mwp-bd--todo" title="To Do">○ {m.todo}</span>
                        {hasOverdue && (
                          <span className="mwp-bd-item mwp-bd--overdue" title="Overdue">⚠ {m.overdue}</span>
                        )}
                      </div>
                    </div>

                    <div className="mwp-col mwp-col--status">
                      <span className={`mwp-status ${statusClass}`}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ──────── GIT ACTIVITY TABLE ──────── */}
        <div className="mwp-panel">
          <div className="mwp-panel-header">
            <span className="mwp-panel-icon mwp-panel-icon--git">🔀</span>
            <span className="mwp-panel-title">Git Contributions</span>
            <span className="mwp-panel-badge">{totalCommits} commits</span>
          </div>

          {gitMembers.length === 0 ? (
            <div className="mwp-empty">No git activity</div>
          ) : (
            <div className="mwp-table">
              <div className="mwp-table-head mwp-grid--git">
                <span className="mwp-col">Member</span>
                <span className="mwp-col">Commits</span>
                <span className="mwp-col">Lines Changed</span>
              </div>

              {gitMembers.map((m) => {
                const initial = m.name[0]?.toUpperCase() || "?";
                const barPct = Math.round((m.commits / maxCommits) * 100);

                return (
                  <div key={m.name} className="mwp-row mwp-grid--git">
                    <div className="mwp-col mwp-col--member">
                      <div className="mwp-avatar mwp-avatar--git">{initial}</div>
                      <span className="mwp-name">{m.name}</span>
                    </div>

                    <div className="mwp-col mwp-col--commits">
                      <div className="mwp-bar-wrap">
                        <div className="mwp-bar">
                          <div
                            className="mwp-bar-fill mwp-bar-fill--git"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="mwp-commit-num">{m.commits}</span>
                      </div>
                    </div>

                    <div className="mwp-col mwp-col--lines">
                      <span className="mwp-add">+{m.additions}</span>
                      <span className="mwp-del">-{m.deletions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

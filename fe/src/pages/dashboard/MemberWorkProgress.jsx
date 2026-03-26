import React, { useMemo } from "react";
import { calculateContribution } from "../../utils/ContributionUtils";
import "./memberWorkProgress.css";

export function MemberWorkProgress({
  tasks = [],
  activities = [],
  title = "Member Work Progress",
  showJiraPanel = true,
  showGitPanel = true,
}) {
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

  const contribRows = useMemo(() => {
    return calculateContribution(
      tasks,
      (t) => t.assigneeName || t._raw?.assigneeName || t._raw?.assignee_name || "Unassigned",
      (t) => t.storyPoints ?? t.story_points ?? t._raw?.storyPoints ?? t._raw?.story_points
    );
  }, [tasks]);

  const jiraMembers = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const name =
        t.assigneeName ||
        t._raw?.assigneeName ||
        t._raw?.assignee_name ||
        "Unassigned";
      if (name === "Unassigned") continue;
      if (!map[name]) {
        map[name] = { total: 0, done: 0, inProgress: 0, todo: 0, overdue: 0 };
      }

      map[name].total += 1;
      const st = t.status || "TODO";
      if (st === "DONE") map[name].done += 1;
      else if (st === "IN_PROGRESS" || st === "IN_REVIEW") map[name].inProgress += 1;
      else map[name].todo += 1;

      if (st !== "DONE" && t.dueDate) {
        const d = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) map[name].overdue += 1;
      }
    }

    return Object.entries(map)
      .map(([name, stats]) => {
        const contrib = contribRows.find(c => c.assignee === name) || { sp: 0, pct: 0 };
        return { name, ...stats, sp: contrib.sp, pct: contrib.pct };
      })
      .sort((a, b) => b.done - a.done);
  }, [tasks, contribRows]);

  const totalCommits = gitMembers.reduce((s, m) => s + m.commits, 0);
  const totalTasks = jiraMembers.reduce((s, m) => s + m.total, 0);
  const maxCommits = gitMembers.length > 0 ? gitMembers[0].commits : 1;

  if ((showGitPanel && gitMembers.length === 0) && (showJiraPanel && jiraMembers.length === 0)) {
    return null;
  }

  const isSinglePanel = (showJiraPanel && !showGitPanel) || (!showJiraPanel && showGitPanel);

  return (
    <div className="mwp">
      <h2 className="section-title">{title}</h2>

      <div className="mwp-split" style={isSinglePanel ? { gridTemplateColumns: "1fr" } : undefined}>
        {showJiraPanel && (
        <div className="mwp-panel">
          <div className="mwp-panel-header">
            <span className="mwp-panel-icon mwp-panel-icon--jira">Tasks</span>
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
                <span className="mwp-col mwp-col-header--contrib">Contribution</span>
                <span className="mwp-col">Status</span>
              </div>

              {jiraMembers.map((m) => {
                const initial = m.name[0]?.toUpperCase() || "?";
                const donePct = Math.round((m.done / m.total) * 100);
                const hasOverdue = m.overdue > 0;

                let statusLabel;
                let statusClass;
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
                        <span className="mwp-bd-item mwp-bd--done" title="Done">OK {m.done}</span>
                        <span className="mwp-bd-item mwp-bd--progress" title="In Progress">IP {m.inProgress}</span>
                        <span className="mwp-bd-item mwp-bd--todo" title="To Do">TD {m.todo}</span>
                        {hasOverdue && (
                          <span className="mwp-bd-item mwp-bd--overdue" title="Overdue">OD {m.overdue}</span>
                        )}
                      </div>
                    </div>

                    <div className="mwp-col">
                      <div className="mwp-contrib-wrap">
                        <span className="mwp-contrib-pct">{m.pct}%</span>
                        <span className="mwp-contrib-sp">{m.sp} SP</span>
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
        )}

        {showGitPanel && (
        <div className="mwp-panel">
          <div className="mwp-panel-header">
            <span className="mwp-panel-icon mwp-panel-icon--git">Git</span>
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
              </div>

              {gitMembers.map((m) => {
                const initial = m.name[0]?.toUpperCase() || "?";
                const barPct = Math.round((m.commits / maxCommits) * 100);

                return (
                  <div key={m.name} className="mwp-row mwp-grid--git mwp-grid--git-compact">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

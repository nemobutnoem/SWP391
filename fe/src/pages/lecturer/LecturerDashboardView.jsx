import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../../services/groups/group.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { GitHubInsights } from "../../components/github/GitHubInsights.jsx";
import "../../pages/dashboard/dashboardPage.css";
import "./lecturer.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) return "upcoming";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function LecturerDashboardView() {
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [githubActivities, setGithubActivities] = useState([]);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // { [groupId]: "tasks" | "activity" }

  useEffect(() => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    gradeService.list().then(setGrades);
    jiraTaskService.list().then(setJiraTasks).catch(() => setJiraTasks([]));
    githubActivityService.list().then(setGithubActivities).catch(() => setGithubActivities([]));
  }, []);

  const myGroups = allGroups;
  const myGrades = grades;
  const pendingCount = myGrades.filter((g) => g.status === "PENDING").length;

  const totalStudents = useMemo(() => {
    const ids = new Set(myGroups.map((g) => g.id));
    return allMembers.filter((m) => ids.has(m.group_id)).length;
  }, [myGroups, allMembers]);

  // Build per-group data
  const enrichedGroups = useMemo(() => {
    return myGroups.map((g) => {
      const members = allMembers.filter((m) => m.group_id === g.id);
      const tasks = jiraTasks.filter((t) => t.group_id === g.id);
      const activities = githubActivities
        .filter((a) => a.group_id === g.id)
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
      const groupGrades = myGrades.filter((gr) => gr.group_id === g.id);

      const doneTasks = tasks.filter((t) => t.status === "Done" || t.status === "DONE").length;
      const totalTasks = tasks.length;
      const overdueTasks = tasks.filter((t) => {
        const due = t.dueDate || t.due_date;
        return due && daysLeft(due) < 0 && t.status !== "Done" && t.status !== "DONE";
      }).length;

      return {
        ...g,
        members,
        tasks,
        activities,
        groupGrades,
        doneTasks,
        totalTasks,
        overdueTasks,
        totalCommits: activities.reduce((s, a) => s + (a.pushed_commit_count || 1), 0),
      };
    });
  }, [myGroups, allMembers, jiraTasks, githubActivities, myGrades]);

  const toggleGroup = (id) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  const getTab = (groupId) => activeTab[groupId] || "tasks";
  const setTab = (groupId, tab) => setActiveTab((prev) => ({ ...prev, [groupId]: tab }));

  return (
    <div className="dashboard-view">
      <PageHeader
        title="Lecturer Dashboard 👋"
        description={`You supervise ${myGroups.length} group(s) with ${totalStudents} students. ${pendingCount} pending grade(s).`}
        actions={
          <div className="action-buttons">
            <Button variant="secondary" size="sm" onClick={() => navigate("/classes")}>
              My Groups
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/grading")}>
              Grade Now ({pendingCount})
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="dashboard-view__grid">
        <StatCard title="Groups" value={myGroups.length} subtext="Supervised" icon="📋" />
        <StatCard title="Students" value={totalStudents} subtext="Under guidance" icon="🧑‍🎓" />
        <StatCard
          title="Pending Grades"
          value={pendingCount}
          subtext={pendingCount > 0 ? "Action needed" : "All clear"}
          trend={pendingCount > 0 ? "warning" : "success"}
          icon="📝"
        />
        <StatCard
          title="Total Tasks"
          value={jiraTasks.length}
          subtext={`${jiraTasks.filter((t) => t.status === "Done" || t.status === "DONE").length} completed`}
          icon="✅"
        />
      </div>

      {/* Group Cards */}
      <div className="lecturer-groups-section">
        <h2 className="section-title" style={{ marginBottom: "1rem" }}>
          My Groups ({enrichedGroups.length})
        </h2>

        {enrichedGroups.length === 0 && (
          <div className="text-secondary" style={{ padding: "2rem", textAlign: "center" }}>
            No groups assigned to you yet.
          </div>
        )}

        {enrichedGroups.map((g) => {
          const isExpanded = expandedGroupId === g.id;
          const tab = getTab(g.id);

          return (
            <div key={g.id} className={`lecturer-group-card ${isExpanded ? "lecturer-group-card--expanded" : ""}`}>
              {/* Group Header - always visible */}
              <div className="lecturer-group-header" onClick={() => toggleGroup(g.id)}>
                <div className="lecturer-group-info">
                  <span className="lecturer-group-icon">{isExpanded ? "📂" : "📁"}</span>
                  <div>
                    <div className="lecturer-group-name">{g.group_name}</div>
                    <div className="lecturer-group-meta">
                      {g.members.length} members · {g.totalTasks} tasks · {g.totalCommits} commits
                    </div>
                  </div>
                </div>
                <div className="lecturer-group-stats">
                  {g.overdueTasks > 0 && (
                    <Badge variant="danger" size="sm">{g.overdueTasks} overdue</Badge>
                  )}
                  <Badge variant={g.totalTasks > 0 && g.doneTasks === g.totalTasks ? "success" : "info"} size="sm">
                    {g.doneTasks}/{g.totalTasks} done
                  </Badge>
                  <span className="lecturer-expand-arrow">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="lecturer-group-detail">
                  {/* Tab Buttons */}
                  <div className="lecturer-tabs">
                    <button
                      className={`lecturer-tab ${tab === "tasks" ? "lecturer-tab--active" : ""}`}
                      onClick={() => setTab(g.id, "tasks")}
                    >
                      📋 Jira Tasks ({g.tasks.length})
                    </button>
                    <button
                      className={`lecturer-tab ${tab === "activity" ? "lecturer-tab--active" : ""}`}
                      onClick={() => setTab(g.id, "activity")}
                    >
                      ⬆️ GitHub Activity ({g.activities.length})
                    </button>
                    <button
                      className={`lecturer-tab ${tab === "grades" ? "lecturer-tab--active" : ""}`}
                      onClick={() => setTab(g.id, "grades")}
                    >
                      📝 Grades ({g.groupGrades.length})
                    </button>
                    <button
                      className={`lecturer-tab ${tab === "insights" ? "lecturer-tab--active" : ""}`}
                      onClick={() => setTab(g.id, "insights")}
                    >
                      📊 Insights
                    </button>
                  </div>

                  {/* Tab Content: Tasks */}
                  {tab === "tasks" && (
                    <div className="lecturer-tab-content">
                      {g.tasks.length === 0 ? (
                        <div className="text-secondary" style={{ padding: "1rem" }}>
                          No Jira tasks synced yet. Sync from the Sync page.
                        </div>
                      ) : (
                        <table className="lecturer-task-table">
                          <thead>
                            <tr>
                              <th>Key</th>
                              <th>Task</th>
                              <th>Status</th>
                              <th>Priority</th>
                              <th>Due</th>
                              <th>Assignee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.tasks.map((t) => {
                              const due = t.dueDate || t.due_date;
                              const dl = daysLeft(due);
                              return (
                                <tr key={t.id}>
                                  <td><code>{t.jira_issue_key}</code></td>
                                  <td>{t.title || t.summary}</td>
                                  <td>
                                    <Badge
                                      variant={
                                        t.status === "Done" || t.status === "DONE" ? "success"
                                          : t.status === "In Progress" || t.status === "IN_PROGRESS" ? "warning"
                                            : "info"
                                      }
                                      size="sm"
                                    >
                                      {t.status}
                                    </Badge>
                                  </td>
                                  <td>{t.priority || "—"}</td>
                                  <td>
                                    {due ? (
                                      <span style={{ color: dl !== null && dl < 0 ? "var(--danger-500)" : dl !== null && dl <= 3 ? "var(--warning-500)" : "inherit" }}>
                                        {due} {dl !== null && dl < 0 ? "⚠️" : ""}
                                      </span>
                                    ) : "—"}
                                  </td>
                                  <td>{t.assigneeName || "Unassigned"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Tab Content: Activity */}
                  {tab === "activity" && (
                    <div className="lecturer-tab-content">
                      {g.activities.length === 0 ? (
                        <div className="text-secondary" style={{ padding: "1rem" }}>
                          No GitHub activity yet. Sync from the Sync page.
                        </div>
                      ) : (
                        <div className="activity-feed">
                          {g.activities.slice(0, 15).map((a) => (
                            <div key={a.id} className="feed-item">
                              <div className="feed-icon" style={{ background: "var(--brand-500)18", color: "var(--brand-500)" }}>⬆️</div>
                              <div className="feed-content">
                                <div className="feed-text">
                                  <strong>{a.github_username}</strong>{" "}
                                  {a.commit_message || `pushed ${a.pushed_commit_count || 0} commit(s)`}
                                </div>
                                <div className="feed-meta">
                                  <span className="feed-time">{timeAgo(a.occurred_at)}</span>
                                  {a.pushed_commit_count > 1 && (
                                    <Badge variant="info" size="sm">{a.pushed_commit_count} commits</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Content: Grades */}
                  {tab === "grades" && (
                    <div className="lecturer-tab-content">
                      {g.groupGrades.length === 0 ? (
                        <div className="text-secondary" style={{ padding: "1rem" }}>
                          No grades yet.{" "}
                          <Button variant="ghost" size="sm" onClick={() => navigate("/grading")}>
                            Go to Grading
                          </Button>
                        </div>
                      ) : (
                        <table className="lecturer-task-table">
                          <thead>
                            <tr>
                              <th>Milestone</th>
                              <th>Score</th>
                              <th>Status</th>
                              <th>Feedback</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.groupGrades.map((gr) => (
                              <tr key={gr.id}>
                                <td>{gr.milestone || "—"}</td>
                                <td>{gr.score != null ? gr.score : "—"}</td>
                                <td>
                                  <Badge variant={gr.status === "GRADED" ? "success" : "warning"} size="sm">
                                    {gr.status}
                                  </Badge>
                                </td>
                                <td>{gr.feedback || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Tab Content: Insights */}
                  {tab === "insights" && (
                    <div className="lecturer-tab-content">
                      <GitHubInsights activities={g.activities} weeks={12} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../../services/groups/group.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import "../../pages/dashboard/dashboardPage.css";
import "./lecturer.css";

const MY_LECTURER_ID = 2;

// Mock upcoming schedule for the lecturer
const UPCOMING_MILESTONES = [
  {
    id: 1,
    group_id: 301,
    group_name: "Agile Warriors",
    type: "SRS Submission",
    due: "2026-02-28",
    daysLeft: 3,
  },
  {
    id: 2,
    group_id: 302,
    group_name: "Code Ninjas",
    type: "SRS Submission",
    due: "2026-02-28",
    daysLeft: 3,
  },
  {
    id: 3,
    group_id: 301,
    group_name: "Agile Warriors",
    type: "Sprint 2 Review",
    due: "2026-03-10",
    daysLeft: 13,
  },
  {
    id: 4,
    group_id: 302,
    group_name: "Code Ninjas",
    type: "Sprint 2 Review",
    due: "2026-03-12",
    daysLeft: 15,
  },
];

// Mock recent student activity
const RECENT_ACTIVITY = [
  {
    id: 1,
    student: "Nguyen Van Anh",
    group: "Agile Warriors",
    action: "Pushed 3 commits to main",
    time: "15 mins ago",
    type: "commit",
  },
  {
    id: 2,
    student: "Pham Duc Duy",
    group: "Agile Warriors",
    action: "Completed task: API Integration",
    time: "2 hours ago",
    type: "task",
  },
  {
    id: 3,
    student: "Vo Thi Phuong",
    group: "Code Ninjas",
    action: "Submitted SRS draft for review",
    time: "3 hours ago",
    type: "submit",
  },
  {
    id: 4,
    student: "Nguyen Dinh Phuc",
    group: "Code Ninjas",
    action: "Opened PR: Feature/user-auth",
    time: "5 hours ago",
    type: "pr",
  },
  {
    id: 5,
    student: "Hoang Van Em",
    group: "Agile Warriors",
    action: "No commits in the last 48 hours",
    time: "48 hours ago",
    type: "warning",
  },
];

const ACTIVITY_ICONS = {
  commit: { icon: "⬆️", color: "var(--brand-500)" },
  task: { icon: "✅", color: "var(--success-500)" },
  submit: { icon: "📄", color: "var(--brand-600)" },
  pr: { icon: "🔀", color: "var(--indigo-500, #6366f1)" },
  warning: { icon: "⚠️", color: "var(--warning-500)" },
};

export function LecturerDashboardView() {
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    gradeService.list().then(setGrades);
  }, []);

  const myGroups = useMemo(
    () => allGroups.filter((g) => g.supervisor_id === MY_LECTURER_ID),
    [allGroups],
  );
  const myGrades = useMemo(
    () => grades.filter((gr) => gr.lecturer_id === MY_LECTURER_ID),
    [grades],
  );

  const pendingCount = myGrades.filter((g) => g.status === "PENDING").length;
  const totalStudents = useMemo(() => {
    const ids = new Set(myGroups.map((g) => g.id));
    return allMembers.filter((m) => ids.has(m.group_id)).length;
  }, [myGroups, allMembers]);

  // Groups with low avg contribution (< 7)
  const atRiskGroups = useMemo(() => {
    return myGroups
      .map((g) => {
        const members = allMembers.filter((m) => m.group_id === g.id);
        const avg = members.length
          ? members.reduce((s, m) => s + m.contribution_score, 0) /
            members.length
          : 0;
        return {
          ...g,
          avgContrib: avg.toFixed(1),
          memberCount: members.length,
        };
      })
      .filter((g) => Number(g.avgContrib) < 8);
  }, [myGroups, allMembers]);

  const urgentMilestones = UPCOMING_MILESTONES.filter((m) => m.daysLeft <= 5);

  return (
    <div className="dashboard-view">
      <PageHeader
        title="Good morning, Dr. Nguyen 👋"
        description={`Today is ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — you have ${pendingCount} pending grade(s) and ${urgentMilestones.length} upcoming deadline(s).`}
        actions={
          <div className="action-buttons">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/classes")}
            >
              Manage Groups
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/grading")}
            >
              Grade Now ({pendingCount})
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="dashboard-view__grid">
        <StatCard
          title="Groups Supervised"
          value={myGroups.length}
          subtext="This semester"
          icon="�"
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtext="Under your guidance"
          icon="🧑‍🎓"
        />
        <StatCard
          title="Pending Grades"
          value={pendingCount}
          subtext="Awaiting your review"
          trend={pendingCount > 0 ? "warning" : "success"}
          trendValue={pendingCount > 0 ? "Action needed" : "All clear"}
          icon="📝"
        />
        <StatCard
          title="Groups At-Risk"
          value={atRiskGroups.length}
          subtext="Avg contribution < 8"
          trend={atRiskGroups.length > 0 ? "warning" : "success"}
          trendValue={atRiskGroups.length > 0 ? "Monitor closely" : "On track"}
          icon="⚠️"
        />
      </div>

      <div className="dashboard-view__main-content">
        <div className="dashboard-view__left-col">
          {/* Upcoming Deadlines */}
          <section className="dashboard-view__section">
            <div className="section-header">
              <h2 className="section-title">Upcoming Milestones</h2>
            </div>
            <div className="milestone-list">
              {UPCOMING_MILESTONES.map((m) => (
                <div
                  key={m.id}
                  className={`milestone-item ${m.daysLeft <= 5 ? "milestone-item--urgent" : ""}`}
                >
                  <div className="milestone-left">
                    <span className="milestone-icon">
                      {m.daysLeft <= 5 ? "🔴" : "🟡"}
                    </span>
                    <div>
                      <div className="milestone-title">{m.type}</div>
                      <div className="milestone-group">{m.group_name}</div>
                    </div>
                  </div>
                  <div className="milestone-right">
                    <div className="milestone-due">{m.due}</div>
                    <Badge
                      variant={m.daysLeft <= 5 ? "danger" : "warning"}
                      size="sm"
                    >
                      {m.daysLeft}d left
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* At-Risk Groups */}
          {atRiskGroups.length > 0 && (
            <section className="dashboard-view__section mt-2">
              <div className="section-header">
                <h2 className="section-title">Groups Needing Attention</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/classes")}
                >
                  View Details
                </Button>
              </div>
              {atRiskGroups.map((g) => (
                <div key={g.id} className="alert-group-card">
                  <div>
                    <div className="profile-name">{g.group_name}</div>
                    <div className="text-secondary">
                      {g.memberCount} members · avg contribution:{" "}
                      <strong>{g.avgContrib}</strong> / 10
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/classes")}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column: Activity Feed */}
        <aside className="dashboard-view__right-col">
          <section className="dashboard-view__section">
            <div className="section-header">
              <h2 className="section-title">Student Activity Feed</h2>
            </div>
            <div className="activity-feed">
              {RECENT_ACTIVITY.map((a) => {
                const meta = ACTIVITY_ICONS[a.type];
                return (
                  <div key={a.id} className="feed-item">
                    <div
                      className="feed-icon"
                      style={{
                        background: `${meta.color}18`,
                        color: meta.color,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div className="feed-content">
                      <div className="feed-text">
                        <strong>{a.student}</strong> {a.action}
                      </div>
                      <div className="feed-meta">
                        <span className="feed-group">{a.group}</span>
                        <span className="feed-time">{a.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

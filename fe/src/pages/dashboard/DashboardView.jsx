import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusBadge } from "../../components/common/StatusComponents.jsx";
import { GitHubInsights } from "../../components/github/GitHubInsights.jsx";
import { ContributionScorecards } from "./ContributionScorecards.jsx";
import { MemberWorkProgress } from "./MemberWorkProgress.jsx";
import "./dashboardPage.css";

export function DashboardView({
  stats,
  activities = [],
  tasks = [],
}) {
  const { counts, progressPct } = stats;

  return (
    <div className="dashboard-view">
      <PageHeader
        title="Project Overview"
        description="Monitor your group progress, task metrics, and upcoming milestones."
      />

      <div className="dashboard-view__grid">
        <StatCard
          title="Overall Progress"
          value={`${progressPct}%`}
          subtext="Total project completion"
          trend="success"
          trendValue="On Track"
          icon="📈"
        />
        <StatCard
          title="Active Tasks"
          value={counts.IN_PROGRESS + counts.IN_REVIEW}
          subtext="Currently being worked on"
          icon="⚡"
        />
        <StatCard
          title="Completed"
          value={counts.DONE}
          subtext="Tasks marked as finished"
          icon="✅"
        />
        <StatCard
          title="Risk Alerts"
          value={counts.OVERDUE}
          subtext="Critical / Overdue tasks"
          trend={counts.OVERDUE > 0 ? "danger" : "success"}
          trendValue={counts.OVERDUE > 0 ? "Attention Required" : "Stable"}
          icon="⚠️"
        />
      </div>

      {/* ── Member Work Progress (full width) ── */}
      <section className="dashboard-view__section" style={{ marginBottom: "2rem" }}>
        <MemberWorkProgress tasks={tasks} activities={activities} />
      </section>

      <div className="dashboard-view__main-content">
        <div className="dashboard-view__left-col">
          <section className="dashboard-view__section">
            <GitHubInsights activities={activities} />
          </section>

          <section className="dashboard-view__section mt-2">
            <div className="section-header">
              <h2 className="section-title">Workflow Pipeline</h2>
              <StatusBadge status="INFO" />
            </div>
            <div className="pipeline-grid">
              <div className="pipeline-item">
                <span className="pipeline-label">Backlog</span>
                <StatusBadge status="TODO" />
                <b className="pipeline-count">{counts.TODO}</b>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">In Development</span>
                <StatusBadge status="IN_PROGRESS" />
                <b className="pipeline-count">{counts.IN_PROGRESS}</b>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Code Review</span>
                <StatusBadge status="IN_REVIEW" />
                <b className="pipeline-count">{counts.IN_REVIEW}</b>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Done</span>
                <StatusBadge status="DONE" />
                <b className="pipeline-count">{counts.DONE}</b>
              </div>
            </div>
          </section>
        </div>

        <aside className="dashboard-view__right-col">
          <section className="dashboard-view__section">
            <div className="section-header">
              <h2 className="section-title">Peer Contributions</h2>
            </div>
            <ContributionScorecards activities={activities} />
          </section>

        </aside>
      </div>
    </div>
  );
}

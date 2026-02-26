import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusBadge } from "../../components/common/StatusComponents.jsx";
import { Button } from "../../components/common/Button.jsx";
import { ActivityHeatmap } from "./ActivityHeatmap.jsx";
import { ContributionScorecards } from "./ContributionScorecards.jsx";
import { CreateTaskModal } from "./CreateTaskModal.jsx";
import "./dashboardPage.css";

export function DashboardView({
  stats,
  activities = [],
  onCreateTask,
  onExportReport,
}) {
  const { counts, progressPct } = stats;
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await onExportReport();
    setIsExporting(false);
    alert(
      "Báo cáo tình trạng dự án đã được xuất thành công! File PDF đang được tải xuống máy của bạn.",
    );
  };

  return (
    <div className="dashboard-view">
      <PageHeader
        title="Project Overview"
        description="Monitor your group progress, task metrics, and upcoming milestones."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export Report"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Task
            </Button>
          </>
        }
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreateTask}
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

      <div className="dashboard-view__main-content">
        <div className="dashboard-view__left-col">
          <ActivityHeatmap activities={activities} />

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

          <section className="dashboard-view__section mt-2">
            <div className="section-header">
              <h2 className="section-title">Recent Intelligence</h2>
            </div>
            <div className="intel-list">
              <div className="intel-item">
                <div className="intel-marker intel-marker--primary"></div>
                <div className="intel-content">
                  <p className="intel-text">
                    Core engine refactored for horizontal scaling.
                  </p>
                  <span className="intel-time">2 hours ago</span>
                </div>
              </div>
              <div className="intel-item">
                <div className="intel-marker intel-marker--success"></div>
                <div className="intel-content">
                  <p className="intel-text">
                    Data persistence layer successfully optimized.
                  </p>
                  <span className="intel-time">5 hours ago</span>
                </div>
              </div>
            </div>
            <a href="/activity" className="dashboard-view__more-link">
              View full activity stream →
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

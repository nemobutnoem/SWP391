import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { Button } from "../../components/common/Button.jsx";
import "./dashboardPage.css";

const DEFAULT_ADMIN_STATS = {
  totalGroups: 0,
  allocatedGroups: 0,
  allocationPct: 0,
  activeLecturers: 0,
};

export function AdminDashboardView({ adminStats = DEFAULT_ADMIN_STATS, systemLogs = [] } = {}) {
  const stats = adminStats;
  const logs = Array.isArray(systemLogs) ? systemLogs : [];
  const navigate = useNavigate();

  return (
    <div className="dashboard-view admin-dashboard">
      <PageHeader
        title="Admin Management Console"
        description="Snapshot of active semester health."
        actions={
          <div className="action-buttons">
            <Button variant="primary" size="sm" onClick={() => navigate("/semesters")}>
              Manage Semester
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/integrations")}>
              Sync Logs
            </Button>
          </div>
        }
      />

      <div className="dashboard-view__grid">
        <StatCard title="Total Groups" value={stats.totalGroups} subtext="Active semester" icon="👥" />

        <StatCard
          title="Topic Allocation"
          value={`${stats.allocatedGroups}/${stats.totalGroups}`}
          subtext="Groups with assigned topics"
          trend={stats.allocationPct > 80 ? "success" : "warning"}
          trendValue={`${stats.allocationPct}%`}
          icon="📋"
        />

        <StatCard
          title="Active Lecturers"
          value={stats.activeLecturers}
          subtext="Supervising projects"
          icon="👨‍🏫"
        />

        <StatCard title="System Status" value="OK" subtext="All services up" trend="success" icon="🛠️" />
      </div>

      <div className="dashboard-view__main-content single-col">
        <section className="dashboard-view__section">
          <div className="section-header">
            <h2 className="section-title">Recent System Activity</h2>
          </div>
          <div className="intel-list">
            {logs.length === 0 && (
              <div className="text-secondary" style={{ padding: "0.75rem 0" }}>
                No recent events.
              </div>
            )}
            {logs.slice(0, 8).map((log, i) => (
              <div key={i} className="intel-item">
                <div className={`intel-marker intel-marker--${log.type || "info"}`} />
                <div className="intel-content">
                  <p className="intel-text">{log.message}</p>
                  <span className="intel-time">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

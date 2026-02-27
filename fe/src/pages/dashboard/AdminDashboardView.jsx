import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./dashboardPage.css";

export function AdminDashboardView({ adminStats, systemLogs }) {
  const stats = adminStats || {
    totalGroups: 0,
    allocatedGroups: 0,
    allocationPct: 0,
    activeLecturers: 0,
  };

  const logs = Array.isArray(systemLogs) ? systemLogs : [];

  return (
    <div className="dashboard-view admin-dashboard">
      <PageHeader
        title="Admin Management Console"
        description="Monitor system health, enrollment metrics, and project allocation progress across all semesters."
        actions={
          <div className="action-buttons">
            <Button variant="secondary" size="sm">
              System Logs
            </Button>
            <Button variant="primary" size="sm">
              Manage Semester
            </Button>
          </div>
        }
      />

      <div className="dashboard-view__grid">
        <StatCard
          title="Total Groups"
          value={stats.totalGroups}
          subtext="Active in current semester"
          icon="👥"
        />
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
        <StatCard
          title="System Status"
          value="Healthy"
          subtext="All services operational"
          trend="success"
          trendValue="100%"
          icon="🛡️"
        />
      </div>

      <div className="dashboard-view__main-content">
        <div className="dashboard-view__left-col">
          <section className="dashboard-view__section">
            <div className="section-header">
              <h2 className="section-title">Allocation Progress by Course</h2>
            </div>
            <div className="progress-chart-list">
              <div className="chart-item">
                <div className="chart-info">
                  <span className="chart-label">SWP391 - Software Project</span>
                  <span className="chart-val">12/15 Groups</span>
                </div>
                <div className="chart-bar-bg">
                  <div
                    className="chart-bar-fill"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>
              <div className="chart-item mt-1">
                <div className="chart-info">
                  <span className="chart-label">EXE201 - Entrepreneurship</span>
                  <span className="chart-val">5/10 Groups</span>
                </div>
                <div className="chart-bar-bg">
                  <div
                    className="chart-bar-fill"
                    style={{ width: "50%", background: "var(--warning-500)" }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-view__section mt-2">
            <div className="section-header">
              <h2 className="section-title">Pending Approvals</h2>
            </div>
            <div className="table-container compact">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Requested</th>
                    <th className="action-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>New Topic: Smart Home IoT</td>
                    <td>
                      <Badge variant="info" size="sm">
                        Topic
                      </Badge>
                    </td>
                    <td>2h ago</td>
                    <td className="action-cell">
                      <Button variant="ghost" size="sm">
                        Review
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Group Change: NW_G03</td>
                    <td>
                      <Badge variant="warning" size="sm">
                        Group
                      </Badge>
                    </td>
                    <td>5h ago</td>
                    <td className="action-cell">
                      <Button variant="ghost" size="sm">
                        Review
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="dashboard-view__right-col">
          <section className="dashboard-view__section">
            <div className="section-header">
              <h2 className="section-title">System Activity</h2>
            </div>
            <div className="intel-list">
              {logs.map((log, i) => (
                <div key={i} className="intel-item">
                  <div
                    className={`intel-marker intel-marker--${log.type}`}
                  ></div>
                  <div className="intel-content">
                    <p className="intel-text">{log.message}</p>
                    <span className="intel-time">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

import React from "react";
import "./dashboardPage.css";

function Card({ title, children }) {
  return (
    <section className="dashCard">
      <div className="dashCardTitle">{title}</div>
      <div>{children}</div>
    </section>
  );
}

export function DashboardView({ stats }) {
  const { counts, progressPct } = stats;

  return (
    <div className="dashWrap">
      <div className="dashTopGrid">
        <Card title="Overall Progress">
          <div className="dashBigNumber">{progressPct}%</div>
          <div className="dashMuted">Based on Done / Total</div>
        </Card>

        <Card title="Open Tasks">
          <div className="dashStatRow">
            <span>To Do</span>
            <b>{counts.TODO}</b>
          </div>
          <div className="dashStatRow">
            <span>In Progress</span>
            <b>{counts.IN_PROGRESS}</b>
          </div>
          <div className="dashStatRow">
            <span>In Review</span>
            <b>{counts.IN_REVIEW}</b>
          </div>
          <div className="dashStatRow">
            <span>Done</span>
            <b>{counts.DONE}</b>
          </div>
        </Card>

        <Card title="Commits This Week">
          <div className="dashBigNumber">35</div>
          <div className="dashMuted">Mock data</div>
        </Card>

        <Card title="Tasks Overdue">
          <div className="dashBigNumber dashDanger">{counts.OVERDUE}</div>
          <div className="dashMuted">Need attention</div>
        </Card>
      </div>

      <div className="dashBottomGrid">
        <Card title="Task Status Summary">
          <div className="dashPlaceholderChart">[Chart placeholder]</div>
        </Card>

        <Card title="Latest Commits">
          <ul className="dashList">
            <li>Fix user authentication bug — 2 hours ago</li>
            <li>Update dashboard components — 4 hours ago</li>
            <li>Add new API endpoints — 6 hours ago</li>
            <li>Refactor database queries — 1 day ago</li>
          </ul>
          <a className="dashLink" href="/activity">
            View all
          </a>
        </Card>
      </div>
    </div>
  );
}
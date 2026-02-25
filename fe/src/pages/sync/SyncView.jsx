import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { Badge } from "../../components/common/Badge.jsx";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function SyncView({ jiraProjects, githubRepos, logs, syncing, syncTarget, onSync }) {
  return (
    <div className="sync-page">
      <PageHeader
        title="Integration Hub"
        description="Manage your Jira and GitHub connections. Sync tasks and code activities to keep the team on track."
      />

      <div className="sync-grid">
        <div className="sync-main-col">
          <section className="sync-card">
            <div className="card-header-icon">
              <span className="icon-badge jira">J</span>
              <h3>Jira Integration</h3>
            </div>
            <div className="integration-list">
              {jiraProjects.map((p) => (
                <div key={p.id} className="integration-item">
                  <div className="item-details">
                    <span className="item-title">
                      {p.jira_project_key} - Project
                    </span>
                    <span className="item-meta">{p.jira_base_url}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSync("Jira")}
                    disabled={syncing}
                  >
                    Sync Now
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="sync-card mt-2">
            <div className="card-header-icon">
              <span className="icon-badge github">G</span>
              <h3>GitHub Repositories</h3>
            </div>
            <div className="integration-list">
              {githubRepos.map((r) => (
                <div key={r.id} className="integration-item">
                  <div className="item-details">
                    <span className="item-title">{r.repo_name}</span>
                    <span className="item-meta">{r.repo_url}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSync("GitHub")}
                    disabled={syncing}
                  >
                    Fetch Commits
                  </Button>
                </div>
              ))}
              <button className="add-repo-btn">+ Link another repository</button>
            </div>
          </section>
        </div>

        <aside className="sync-side-col">
          <section className="sync-card h-full">
            <div className="section-header-simple">
              <h3>Recent Actions</h3>
              <Badge variant="neutral" size="sm">
                Audit Log
              </Badge>
            </div>
            <div className="audit-log">
              {logs.map((log) => (
                <div key={log.id} className="audit-item">
                  <div
                    className={`log-indicator ${log.status === "OK" ? "success" : "error"}`}
                  />
                  <div className="log-body">
                    <p className="log-msg">{log.action}</p>
                    <span className="log-date">
                      {new Date(log.at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {syncing && (
        <div className="sync-overlay">
          <div className="sync-modal">
            <LoadingSpinner />
            <div className="sync-status">Updating {syncTarget} Data...</div>
            <p className="sync-sub">
              Talking to external APIs and updating local cache.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

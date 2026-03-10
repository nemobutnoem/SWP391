import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { Badge } from "../../components/common/Badge.jsx";

/**
 * Code Activities – Presentation layer.
 * Hiển thị commit timeline, filter theo repo / branch / contributor.
 */
export function SyncView({
  activities,
  githubRepos,
  stats,
  loading,
  syncing,
  repos,
  branches,
  actors,
  repoFilter,
  branchFilter,
  actorFilter,
  searchQuery,
  onRepoFilterChange,
  onBranchFilterChange,
  onActorFilterChange,
  onSearchQueryChange,
  onFetchCommits,
  getStudentName,
}) {
  if (loading) {
    return (
      <div className="code-activities-page">
        <PageHeader
          title="Code Activities"
          description="Monitor commits and code changes from all repositories and branches."
        />
        <div className="ca-loading">
          <LoadingSpinner />
          <p>Loading code activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-activities-page">
      <div className="ca-page-header-row">
        <PageHeader
          title="Code Activities"
          description="Monitor commits and code changes from all repositories and branches."
        />
        <button
          className={`ca-sync-github-btn ${syncing ? "ca-sync-github-btn--syncing" : ""}`}
          onClick={onFetchCommits}
          disabled={syncing}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          {syncing ? "Syncing..." : "Sync GitHub"}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="ca-stats-row">
        <div className="ca-stat-card">
          <div className="ca-stat-icon commits">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.001 4.001 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
            </svg>
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-value">{stats.totalCommits}</span>
            <span className="ca-stat-label">Total Commits</span>
          </div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-icon branches-icon">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
            </svg>
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-value">{stats.activeBranches}</span>
            <span className="ca-stat-label">Active Branches</span>
          </div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-icon contributors-icon">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4.001 4.001 0 0 0-6.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 4.6 8.049 3.5 3.5 0 0 1 2 5.5ZM5.5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.5.5a2.5 2.5 0 1 1 4.446 1.586 4.509 4.509 0 0 1 2.266 3.163.75.75 0 1 1-1.482.236 3.001 3.001 0 0 0-2.83-2.57.75.75 0 0 1 0-1.5A1 1 0 1 0 13 4.5Z" />
            </svg>
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-value">{stats.contributors}</span>
            <span className="ca-stat-label">Contributors</span>
          </div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-icon today-icon">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z" />
            </svg>
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-value">{stats.todayCommits}</span>
            <span className="ca-stat-label">Today</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ca-filters-bar">
        <div className="ca-filter-group ca-search-group">
          <label className="ca-filter-label">Search</label>
          <div className="ca-search-wrapper">
            <svg className="ca-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
            </svg>
            <input
              type="text"
              className="ca-search-input"
              placeholder="Search commits..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        </div>
        <div className="ca-filter-group">
          <label className="ca-filter-label">Repository</label>
          <select
            className="ca-filter-select"
            value={repoFilter}
            onChange={(e) => onRepoFilterChange(e.target.value)}
          >
            {repos.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Repositories" : r}
              </option>
            ))}
          </select>
        </div>
        <div className="ca-filter-group">
          <label className="ca-filter-label">Branch</label>
          <select
            className="ca-filter-select"
            value={branchFilter}
            onChange={(e) => onBranchFilterChange(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b === "all" ? "All Branches" : b}
              </option>
            ))}
          </select>
        </div>
        <div className="ca-filter-group">
          <label className="ca-filter-label">Contributor</label>
          <select
            className="ca-filter-select"
            value={actorFilter}
            onChange={(e) => onActorFilterChange(e.target.value)}
          >
            {actors.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Contributors" : getStudentName(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commit Timeline */}
      <section className="ca-commits-section">
        <div className="ca-section-header">
          <div className="ca-section-title">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="ca-section-icon">
              <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5h2.792a.25.25 0 0 1 .177.427L2.357 3.143a.5.5 0 0 1-.714 0ZM.75 7a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H.75Zm0 5a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H.75ZM3 2a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5A.75.75 0 0 0 3 2Z" />
            </svg>
            <h3>Commit History</h3>
          </div>
          <Badge variant="neutral" size="sm">
            {activities.length} commit{activities.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="ca-timeline">
          {activities.length === 0 ? (
            <div className="ca-empty-state">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" className="ca-empty-icon">
                <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.001 4.001 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z" />
              </svg>
              <p>No commits found matching your filters.</p>
              <span className="ca-empty-hint">Try adjusting your filters or fetch new commits.</span>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="ca-commit-item">
                <div className={`ca-commit-dot ca-commit-dot--${activity.activity_type || "commit"}`} />
                <div className="ca-commit-card">
                  <div className="ca-commit-header">
                    <div className="ca-commit-header-left">
                      <Badge
                        variant={activity.activity_type === "push" ? "success" : "primary"}
                        size="sm"
                      >
                        {(activity.activity_type || "commit").toUpperCase()}
                      </Badge>
                      <span className="ca-commit-user">
                        <strong>{getStudentName(activity.github_username)}</strong>
                        <span className="ca-commit-username">
                          @{activity.github_username}
                        </span>
                      </span>
                    </div>
                    <span className="ca-commit-time">
                      {new Date(activity.occurred_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="ca-commit-message">
                    <p>{activity.commit_message}</p>
                  </div>

                  <div className="ca-commit-footer">
                    <div className="ca-commit-meta">
                      <div className="ca-commit-branch">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
                        </svg>
                        {(activity._branches || [activity.ref_name || "main"]).map((b) => (
                          <code key={b} style={{ marginRight: 4 }}>{b}</code>
                        ))}
                      </div>
                      {activity.repo_name && (
                        <div className="ca-commit-repo">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
                          </svg>
                          <code>{activity.repo_name}</code>
                        </div>
                      )}
                    </div>
                    {activity.commit_sha && (
                      <div className="ca-commit-sha">
                        <code>{activity.commit_sha.substring(0, 7)}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {syncing && (
        <div className="ca-overlay">
          <div className="ca-modal">
            <LoadingSpinner />
            <div className="ca-modal-title">Fetching Commits...</div>
            <p className="ca-modal-sub">
              Pulling latest commits from all linked repositories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

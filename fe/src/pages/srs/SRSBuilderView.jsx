import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";

const CATEGORIES = [
  { id: "UNMAPPED", title: "Unmapped Tasks", color: "var(--slate-400)" },
  { id: "FUNCTIONAL", title: "Functional Requirements", color: "var(--brand-500)" },
  { id: "NON_FUNCTIONAL", title: "Non-Functional Requirements", color: "var(--success)" },
  { id: "CONSTRAINT", title: "System Constraints", color: "var(--warning)" },
];

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function SRSBuilderView({
  viewMode,
  onViewModeChange,
  groupedTasks,
  isGenerating,
  lastSaved,
  onMoveTask,
  onGenerate,
  onDrop,
  groups = [],
  classes = [],
  selectedClassId,
  onClassChange,
  selectedGroupId,
  onGroupChange,
  previewRef,
}) {
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, categoryId) => {
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    onDrop(taskId, categoryId);
  };

  return (
    <div className="srs-builder">
      <PageHeader
        title="SRS Requirement Matrix"
        description="Efficiently categorize engineering tasks into formal SRS sections using the Matrix Board."
        actions={
          <div className="builder-actions">
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === "builder" ? "active" : ""}`}
                onClick={() => onViewModeChange("builder")}
              >
                Matrix Board
              </button>
              <button
                className={`toggle-btn ${viewMode === "preview" ? "active" : ""}`}
                onClick={() => onViewModeChange("preview")}
              >
                Doc Preview
              </button>
            </div>
            {lastSaved && (
              <span className="save-status">Synced at {lastSaved}</span>
            )}
            <Button
              variant="primary"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Export PDF" : "Export PDF Report"}
            </Button>
          </div>
        }
      />

      <div className="builder-container">
        {(groups.length > 0 || classes.length > 0) && (
          <div className="srs-group-filter" style={{ display: "inline-flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            {classes.length > 0 && (
              <>
                <label className="integration-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Class</label>
                <select
                  className="integration-input"
                  style={{ width: "auto", minWidth: "180px" }}
                  value={selectedClassId || ""}
                  onChange={(e) => onClassChange(Number(e.target.value))}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_code || c.class_name || `Class ${c.id}`}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label className="integration-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Group</label>
            <select
              className="integration-input"
              style={{ width: "auto", minWidth: "180px" }}
              value={selectedGroupId || ""}
              onChange={(e) => onGroupChange(Number(e.target.value))}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name || `Group ${g.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {viewMode === "builder" ? (
          <div className="matrix-board">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="matrix-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cat.id)}
              >
                <div
                  className="matrix-col-header"
                  style={{ borderTopColor: cat.color }}
                >
                  <h3 className="matrix-col-title">{cat.title}</h3>
                  <span className="matrix-col-count">
                    {groupedTasks[cat.id].length}
                  </span>
                </div>
                <div className="matrix-col-body">
                  {groupedTasks[cat.id].map((task) => (
                    <div
                      key={task.id}
                      className="matrix-task-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div className="task-card-header">
                        <span className="task-card-key">
                          {task.jira_issue_key}
                        </span>
                      </div>
                      <p className="task-card-title">{task.title}</p>
                      <div className="task-card-actions">
                        {cat.id !== "FUNCTIONAL" && (
                          <button
                            onClick={() => onMoveTask(task.id, "FUNCTIONAL")}
                            title="Move to Functional"
                          >
                            F
                          </button>
                        )}
                        {cat.id !== "NON_FUNCTIONAL" && (
                          <button
                            onClick={() => onMoveTask(task.id, "NON_FUNCTIONAL")}
                            title="Move to Non-Functional"
                          >
                            N
                          </button>
                        )}
                        {cat.id !== "CONSTRAINT" && (
                          <button
                            onClick={() => onMoveTask(task.id, "CONSTRAINT")}
                            title="Move to Constraint"
                          >
                            C
                          </button>
                        )}
                        {cat.id !== "UNMAPPED" && (
                          <button
                            className="btn-unmap"
                            onClick={() => onMoveTask(task.id, "UNMAPPED")}
                            title="Unmap"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {groupedTasks[cat.id].length === 0 && (
                    <div className="matrix-empty-hint">Drop tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="document-preview">
            <div className="preview-paper" ref={previewRef}>
              <header className="paper-header">
                <h1>SOFTWARE REQUIREMENT SPECIFICATION</h1>
                <p>A Supporting Tool for Requirements and Project Progress Management in Software Project Course SWP391 Using Jira and GitHub</p>
                <p className="paper-version">Version 1.0 — {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </header>

              {/* 1. Introduction */}
              <section className="preview-section">
                <h2 className="section-number">1. Introduction</h2>

                <h3>1.1 Purpose</h3>
                <p>This Software Requirement Specification (SRS) document describes the functional and non-functional requirements for the SWP391 Project Management Tool. The system integrates with Jira and GitHub to support requirements tracking, task management, and project progress monitoring for student software projects in the SWP391 course at FPT University.</p>

                <h3>1.2 Scope</h3>
                <p>The system provides a web-based platform that allows Admins to manage semesters, classes, and groups; Lecturers to oversee student groups and monitor project progress; Team Leaders to manage requirements, assign tasks, and track contributions; and Team Members to view assigned tasks and update their work status. The tool synchronizes data from Jira (for task/issue tracking) and GitHub (for commit/contribution tracking).</p>

                <h3>1.3 Definitions and Acronyms</h3>
                <table className="srs-table">
                  <thead>
                    <tr><th>Term</th><th>Definition</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>SRS</td><td>Software Requirement Specification</td></tr>
                    <tr><td>SWP391</td><td>Software Project course at FPT University</td></tr>
                    <tr><td>Jira</td><td>Atlassian project management and issue tracking tool</td></tr>
                    <tr><td>GitHub</td><td>Version control and source code hosting platform</td></tr>
                    <tr><td>API</td><td>Application Programming Interface</td></tr>
                    <tr><td>LOC</td><td>Lines of Code</td></tr>
                  </tbody>
                </table>

                <h3>1.4 References</h3>
                <ul className="preview-list">
                  <li>IEEE 830-1998 — Recommended Practice for Software Requirements Specifications</li>
                  <li>Jira REST API Documentation — Atlassian Developer</li>
                  <li>GitHub REST API Documentation — GitHub Docs</li>
                </ul>
              </section>

              {/* 2. Overall Description */}
              <section className="preview-section">
                <h2 className="section-number">2. Overall Description</h2>

                <h3>2.1 Product Perspective</h3>
                <p>This system is a standalone web application built with React (frontend) and Spring Boot (backend), connected to an Azure SQL database. It integrates with external services (Jira Cloud API and GitHub API) to synchronize project data. The system does not replace Jira or GitHub but acts as a centralized dashboard for monitoring and reporting.</p>

                <h3>2.2 User Classes and Characteristics</h3>
                <table className="srs-table">
                  <thead>
                    <tr><th>Role</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Admin</td><td>Manages semesters, classes, groups, lecturers, and system-wide integration settings.</td></tr>
                    <tr><td>Lecturer</td><td>Manages students, views SRS requirements, monitors task progress and GitHub contributions across assigned groups.</td></tr>
                    <tr><td>Team Leader</td><td>Configures group integrations (Jira/GitHub), manages and categorizes requirements, assigns tasks, monitors team progress and commits.</td></tr>
                    <tr><td>Team Member</td><td>Views assigned tasks, updates task status, commits code, and views personal contribution statistics.</td></tr>
                  </tbody>
                </table>

                <h3>2.3 Operating Environment</h3>
                <ul className="preview-list">
                  <li>Frontend: React 19, deployed on Vercel</li>
                  <li>Backend: Spring Boot 3.4, deployed on Render</li>
                  <li>Database: Microsoft Azure SQL Server</li>
                  <li>Browser support: Chrome, Firefox, Edge (latest versions)</li>
                </ul>

                <h3>2.4 Assumptions and Dependencies</h3>
                <ul className="preview-list">
                  <li>Each student group has a valid Jira project and GitHub repository configured.</li>
                  <li>Users authenticate via Google OAuth (FPT University email).</li>
                  <li>Jira and GitHub API tokens are provided by the Team Leader.</li>
                  <li>Internet connectivity is required for API synchronization.</li>
                </ul>
              </section>

              {/* 3. Specific Requirements */}
              <section className="preview-section">
                <h2 className="section-number">3. Specific Requirements</h2>
              </section>

              {CATEGORIES.slice(1).map((cat, idx) => (
                <section key={cat.id} className="preview-section">
                  <h3>3.{idx + 1} {cat.title}</h3>
                  {groupedTasks[cat.id].length === 0 ? (
                    <p className="no-tasks">
                      No requirements defined for this section.
                    </p>
                  ) : (
                    <table className="srs-table">
                      <thead>
                        <tr><th>ID</th><th>Requirement</th></tr>
                      </thead>
                      <tbody>
                        {groupedTasks[cat.id].map((t) => (
                          <tr key={t.id}>
                            <td>{t.jira_issue_key}</td>
                            <td>{t.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { getJiraTasks } from "../../services/mockDb.service.js";
import "./srsBuilder.css";

const CATEGORIES = [
  { id: "UNMAPPED", title: "Unmapped Tasks", color: "var(--slate-400)" },
  {
    id: "FUNCTIONAL",
    title: "Functional Requirements",
    color: "var(--brand-500)",
  },
  {
    id: "NON_FUNCTIONAL",
    title: "Non-Functional Requirements",
    color: "var(--success)",
  },
  { id: "CONSTRAINT", title: "System Constraints", color: "var(--warning)" },
];

export function SRSBuilderPage() {
  const [viewMode, setViewMode] = useState("builder"); // 'builder' or 'preview'
  const [tasks, setTasks] = useState(() =>
    getJiraTasks().map((t) => ({ ...t, category: "UNMAPPED" })),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleMoveTask = (taskId, newCategory) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, category: newCategory } : t)),
    );
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(
        "SRS Báo cáo đã được xuất thành công! Tập tin PDF đang được chuẩn bị tải xuống.",
      );
    }, 2000);
  };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const groupedTasks = useMemo(() => {
    const groups = {
      UNMAPPED: [],
      FUNCTIONAL: [],
      NON_FUNCTIONAL: [],
      CONSTRAINT: [],
    };
    tasks.forEach((t) => groups[t.category].push(t));
    return groups;
  }, [tasks]);

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
                onClick={() => setViewMode("builder")}
              >
                Matrix Board
              </button>
              <button
                className={`toggle-btn ${viewMode === "preview" ? "active" : ""}`}
                onClick={() => setViewMode("preview")}
              >
                Doc Preview
              </button>
            </div>
            {lastSaved && (
              <span className="save-status">Synced at {lastSaved}</span>
            )}
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Export PDF" : "Export PDF Report"}
            </Button>
          </div>
        }
      />

      <div className="builder-container">
        {viewMode === "builder" ? (
          <div className="matrix-board">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="matrix-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = parseInt(e.dataTransfer.getData("taskId"));
                  handleMoveTask(taskId, cat.id);
                }}
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
                      onDragStart={(e) => onDragStart(e, task.id)}
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
                            onClick={() =>
                              handleMoveTask(task.id, "FUNCTIONAL")
                            }
                            title="Move to Functional"
                          >
                            F
                          </button>
                        )}
                        {cat.id !== "NON_FUNCTIONAL" && (
                          <button
                            onClick={() =>
                              handleMoveTask(task.id, "NON_FUNCTIONAL")
                            }
                            title="Move to Non-Functional"
                          >
                            N
                          </button>
                        )}
                        {cat.id !== "CONSTRAINT" && (
                          <button
                            onClick={() =>
                              handleMoveTask(task.id, "CONSTRAINT")
                            }
                            title="Move to Constraint"
                          >
                            C
                          </button>
                        )}
                        {cat.id !== "UNMAPPED" && (
                          <button
                            className="btn-unmap"
                            onClick={() => handleMoveTask(task.id, "UNMAPPED")}
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
            <div className="preview-paper">
              <header className="paper-header">
                <h1>SOFTWARE REQUIREMENT SPECIFICATION</h1>
                <p>Project: VibeSync Jira-GitHub Integration</p>
              </header>
              {CATEGORIES.slice(1).map((cat) => (
                <section key={cat.id} className="preview-section">
                  <h3>{cat.title}</h3>
                  {groupedTasks[cat.id].length === 0 ? (
                    <p className="no-tasks">
                      No requirements defined for this section.
                    </p>
                  ) : (
                    <ul className="preview-list">
                      {groupedTasks[cat.id].map((t) => (
                        <li key={t.id}>
                          <strong>[{t.jira_issue_key}]</strong> {t.title}
                        </li>
                      ))}
                    </ul>
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

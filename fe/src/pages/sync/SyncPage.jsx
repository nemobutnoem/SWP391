import React, { useState, useMemo } from "react";
import {
  getJiraProjects,
  getGithubRepositories,
  getSyncLogs,
} from "../../services/mockDb.service.js";
import { SyncView } from "./SyncView.jsx";
import "./sync.css";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 */
export function SyncPage() {
  const jiraProjects = useMemo(() => getJiraProjects(), []);
  const githubRepos = useMemo(() => getGithubRepositories(), []);
  const initialLogs = useMemo(() => getSyncLogs(), []);

  const [logs, setLogs] = useState(initialLogs);
  const [syncing, setSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState("");

  const handleSync = (target) => {
    setSyncTarget(target);
    setSyncing(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        action: `Synchronized ${target} data for the group`,
        status: "OK",
        at: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      setSyncing(false);
    }, 1500);
  };

  return (
    <SyncView
      jiraProjects={jiraProjects}
      githubRepos={githubRepos}
      logs={logs}
      syncing={syncing}
      syncTarget={syncTarget}
      onSync={handleSync}
    />
  );
}

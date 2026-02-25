import React, { useEffect, useState } from "react";
import { jiraProjectService } from "../../services/jiraProjects/jiraProject.service.js";
import { githubRepositoryService } from "../../services/githubRepositories/githubRepository.service.js";
import { syncLogService } from "../../services/syncLogs/syncLog.service.js";
import { SyncView } from "./SyncView.jsx";
import "./sync.css";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 */
export function SyncPage() {
  const [jiraProjects, setJiraProjects] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState("");

  useEffect(() => {
    jiraProjectService.list().then(setJiraProjects);
    githubRepositoryService.list().then(setGithubRepos);
    syncLogService.list().then(setLogs);
  }, []);

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

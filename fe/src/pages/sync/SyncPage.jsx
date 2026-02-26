import React, { useEffect, useState } from "react";
import { jiraProjectService } from "../../services/jiraProjects/jiraProject.service.js";
import { githubRepositoryService } from "../../services/githubRepositories/githubRepository.service.js";
import { syncLogService } from "../../services/syncLogs/syncLog.service.js";
import { syncService } from "../../services/sync/sync.service.js";
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

  const handleSync = async (target) => {
    const t = String(target || "").trim().toLowerCase();
    setSyncTarget(target);
    setSyncing(true);
    try {
      let res;
      if (t === "jira") res = await syncService.syncJira();
      else if (t === "github") res = await syncService.syncGithub();
      else res = await syncService.syncAll();

      const newLog = {
        id: Date.now(),
        action: `Synchronized ${target} data`,
        status: res?.ok ? "OK" : "ERROR",
        at: new Date().toISOString(),
        detail: res?.message,
      };
      setLogs((prev) => [newLog, ...prev]);

      // best-effort reload from server (if server keeps logs)
      syncLogService.list().then(setLogs).catch(() => {});
    } catch (e) {
      const newLog = {
        id: Date.now(),
        action: `Synchronized ${target} data`,
        status: "ERROR",
        at: new Date().toISOString(),
        detail: e?.message || "Sync failed",
      };
      setLogs((prev) => [newLog, ...prev]);
      console.error("[SyncPage] sync failed:", e);
    } finally {
      setSyncing(false);
    }
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

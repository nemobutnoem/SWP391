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
    jiraProjectService
      .list()
      .then((data) => {
        console.log("[SyncPage] Jira projects loaded:", Array.isArray(data) ? data.length : data);
        setJiraProjects(data);
      })
      .catch((e) => console.error("[SyncPage] Jira projects load failed:", e));

    githubRepositoryService
      .list()
      .then((data) => {
        console.log("[SyncPage] GitHub repos loaded:", Array.isArray(data) ? data.length : data);
        setGithubRepos(data);
      })
      .catch((e) => console.error("[SyncPage] GitHub repos load failed:", e));

    syncLogService
      .list()
      .then((data) => {
        console.log("[SyncPage] Sync logs loaded:", Array.isArray(data) ? data.length : data);
        setLogs(data);
      })
      .catch((e) => console.error("[SyncPage] Sync logs load failed:", e));
  }, []);

  const handleSync = async (target, jiraProjectKey) => {
    const t = String(target || "").trim().toLowerCase();
    setSyncTarget(t === "jira" ? "Jira" : t === "github" ? "GitHub" : String(target || ""));
    setSyncing(true);
    try {
      let res;
      console.log("[SyncPage] Sync start:", { target: t, jiraProjectKey });

      if (t === "jira") res = await syncService.syncJira({ projectKey: jiraProjectKey });
      else if (t === "github") res = await syncService.syncGithub();
      else res = await syncService.syncAll();

      console.log("[SyncPage] Sync response:", res);

      const newLog = {
        id: Date.now(),
        action: `Synchronized ${target} data`,
        status: res?.ok ? "OK" : "ERROR",
        at: new Date().toISOString(),
        detail: res?.message,
      };
      setLogs((prev) => [newLog, ...prev]);

      // Best-effort reload from server (if server keeps logs).
      // Do NOT overwrite local log list with an empty array.
      syncLogService
        .list()
        .then((serverLogs) => {
          if (Array.isArray(serverLogs) && serverLogs.length > 0) {
            console.log("[SyncPage] Server logs received:", serverLogs.length);
            setLogs(serverLogs);
          } else {
            console.log("[SyncPage] Server logs empty; keeping local logs");
          }
        })
        .catch((e) => console.warn("[SyncPage] Sync logs reload failed:", e));
    } catch (e) {
      console.error("[SyncPage] sync failed:", e);
      const newLog = {
        id: Date.now(),
        action: `Synchronized ${target} data`,
        status: "ERROR",
        at: new Date().toISOString(),
        detail: e?.message || "Sync failed",
      };
      setLogs((prev) => [newLog, ...prev]);
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

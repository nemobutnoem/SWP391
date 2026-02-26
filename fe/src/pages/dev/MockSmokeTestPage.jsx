import React, { useEffect, useState } from "react";
import { authService } from "../../services/auth/auth.service.js";
import { contextService } from "../../services/context/context.service.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { syncService } from "../../services/integrations/sync.service.js";

export function MockSmokeTestPage() {
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    let mounted = true;

    async function run() {
      const session = await authService.getSession();
      const ctx = await contextService.getMyContext();

      const groupId = ctx.group?.id;

      const tasks = groupId ? await jiraTaskService.listByGroup(groupId) : [];
      const activities = groupId
        ? await githubActivityService.listByGroup(groupId)
        : [];
      const logs = groupId ? await syncService.listLogs(groupId) : [];

      if (mounted) {
        setData({
          loading: false,
          env: { VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK },
          session,
          ctx,
          tasksCount: tasks.length,
          activitiesCount: activities.length,
          logsCount: logs.length,
          sample: { task: tasks[0], activity: activities[0], log: logs[0] },
        });
      }
    }

    run().catch((e) => {
      if (mounted) setData({ loading: false, error: String(e?.message || e) });
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (data.loading) return <div>Loading mock smoke test...</div>;
  if (data.error) return <pre style={{ color: "red" }}>{data.error}</pre>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Mock Smoke Test</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
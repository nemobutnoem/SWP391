import React, { useEffect, useState } from "react";
import { contextService } from "../../services/context/context.service.js";
import { syncService } from "../../services/integrations/sync.service.js";

export function SyncPage() {
  const [groupId, setGroupId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    contextService.getMyContext().then((ctx) => setGroupId(ctx.group?.id));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    syncService.listLogs(groupId).then(setLogs);
  }, [groupId]);

  async function onSync() {
    if (!groupId) return;
    setLoading(true);
    try {
      await syncService.syncNow(groupId);
      const next = await syncService.listLogs(groupId);
      setLogs(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Sync</h2>
      <button onClick={onSync} disabled={loading || !groupId}>
        {loading ? "Syncing..." : "Sync now"}
      </button>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}
import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const syncMock = {
  async listLogs(groupId) {
    await sleep(150);
    const gid = Number(groupId);
    return mockDb.syncLogs
      .filter((l) => l.group_id === gid)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  },

  async syncNow(groupId) {
    await sleep(700);
    const gid = Number(groupId);
    const now = new Date().toISOString();

    const entry = {
      id: Date.now(),
      group_id: gid,
      at: now,
      action: "sync",
      result: "OK",
      detail: "Synced to Jira (mock)",
    };

    mockDb.syncLogs.unshift(entry);
    return entry;
  },
};
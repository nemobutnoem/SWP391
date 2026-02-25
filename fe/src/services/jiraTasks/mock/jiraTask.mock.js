import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const jiraTaskMock = {
  async listByGroup(groupId) {
    await sleep(250);

    const gid = Number(groupId);
    const all = Array.isArray(mockDb.jiraTasks) ? mockDb.jiraTasks : [];

    // ép Number để tránh case group_id là "1"
    const filtered = all.filter((t) => Number(t.group_id) === gid);

    const result = (filtered.length > 0 ? filtered : all).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    return result;
  },

  async updateStatus(taskId, status) {
    await sleep(220);
    const item = (mockDb.jiraTasks || []).find((t) => Number(t.id) === Number(taskId));
    if (!item) throw new Error("Task not found");
    item.status = status;
    item.updated_at = new Date().toISOString();
    return { ...item };
  },
};
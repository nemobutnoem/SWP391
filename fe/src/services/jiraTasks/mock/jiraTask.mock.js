import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const jiraTaskMock = {
  async listByGroup(groupId) {
    await sleep(250);
    return mockDb.jiraTasks
      .filter((t) => t.group_id === Number(groupId))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  async updateStatus(taskId, status) {
    await sleep(220);
    const item = mockDb.jiraTasks.find((t) => t.id === Number(taskId));
    if (!item) throw new Error("Task not found");
    item.status = status;
    item.updated_at = new Date().toISOString();
    return { ...item };
  },
};
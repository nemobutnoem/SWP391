import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const githubActivityMock = {
  async list() {
    await sleep(250);
    return [...mockDb.githubActivities].sort(
      (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
    );
  },

  async listByGroup(groupId) {
    await sleep(250);
    return mockDb.githubActivities
      .filter((a) => a.group_id === Number(groupId))
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
  },
};
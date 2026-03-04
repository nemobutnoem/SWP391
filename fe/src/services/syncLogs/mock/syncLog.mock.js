import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const syncLogMock = {
  async listByGroup(groupId) {
    await sleep(200);
    return [...mockDb.syncLogs]
      .filter((l) => l.group_id === Number(groupId))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  },

  async list() {
    await sleep(200);
    return [...mockDb.syncLogs].sort(
      (a, b) => new Date(b.at) - new Date(a.at),
    );
  },
};

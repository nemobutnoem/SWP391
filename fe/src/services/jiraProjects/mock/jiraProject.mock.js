import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const jiraProjectMock = {
  async listByGroup(groupId) {
    await sleep(200);
    return mockDb.jiraProjects.filter(
      (p) => p.group_id === Number(groupId),
    );
  },

  async list() {
    await sleep(200);
    return [...mockDb.jiraProjects];
  },
};

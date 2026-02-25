import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const githubRepositoryMock = {
  async listByGroup(groupId) {
    await sleep(200);
    return mockDb.githubRepositories.filter(
      (r) => r.group_id === Number(groupId),
    );
  },

  async list() {
    await sleep(200);
    return [...mockDb.githubRepositories];
  },
};

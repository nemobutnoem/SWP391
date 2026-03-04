import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const integrationMock = {
  async getByGroup(groupId) {
    await sleep(200);
    const gid = Number(groupId);
    return {
      jira: mockDb.jiraProjects.find((x) => x.group_id === gid) || null,
      github: mockDb.githubRepositories.find((x) => x.group_id === gid) || null,
    };
  },
};
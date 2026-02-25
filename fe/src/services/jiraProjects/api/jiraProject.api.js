import { http } from "../../http/httpClient.js";

export const jiraProjectApi = {
  async list() {
    const res = await http.get("/jira-projects");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/jira-projects?groupId=${groupId}`);
    return res.data;
  },
};

import { http } from "../../http/httpClient.js";

export const jiraTaskApi = {
  async listByGroup(groupId) {
    const res = await http.get(`/groups/${groupId}/jira-tasks`);
    return res.data;
  },

  async updateStatus(taskId, status) {
    const res = await http.patch(`/jira-tasks/${taskId}`, { status });
    return res.data;
  },
};
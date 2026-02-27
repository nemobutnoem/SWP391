import { http } from "../../http/httpClient.js";

export const jiraTaskApi = {
  async list() {
    const res = await http.get("/jira-tasks");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/groups/${groupId}/jira-tasks`);
    return res.data;
  },

  async updateStatus(taskId, status) {
    const res = await http.patch(`/jira-tasks/${taskId}`, { status });
    return res.data;
  },

  async updateAssignee(taskId, assigneeUserId) {
    // Use 0 to explicitly request "unassigned" (backend normalizes <=0 -> null)
    const payload = { assigneeUserId: assigneeUserId == null ? 0 : Number(assigneeUserId) };
    const res = await http.patch(`/jira-tasks/${taskId}`, payload);
    return res.data;
  },
};
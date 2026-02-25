import { http } from "../../http/httpClient.js";

export const syncApi = {
  async listLogs(groupId) {
    const res = await http.get(`/groups/${groupId}/sync/logs`);
    return res.data;
  },

  async syncNow(groupId) {
    // BE sẽ làm: pull github + push jira ... tùy design
    const res = await http.post(`/groups/${groupId}/sync`, {});
    return res.data;
  },
};
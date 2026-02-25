import { http } from "../../http/httpClient.js";

export const githubActivityApi = {
  async listByGroup(groupId) {
    const res = await http.get(`/groups/${groupId}/github-activities`);
    return res.data;
  },
};
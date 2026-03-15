import { http } from "../../http/httpClient.js";

export const githubActivityApi = {
  async list() {
    const res = await http.get("/github-activities");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/groups/${groupId}/github-activities`);
    return res.data;
  },
};
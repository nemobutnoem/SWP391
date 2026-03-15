import { http } from "../../http/httpClient.js";

export const githubRepositoryApi = {
  async list() {
    const res = await http.get("/github-repositories");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/github-repositories?groupId=${groupId}`);
    return res.data;
  },
};

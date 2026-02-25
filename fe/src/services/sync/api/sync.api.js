import { http } from "../../http/httpClient.js";

export const syncApi = {
  async syncAll() {
    const res = await http.post("/sync/all", {}, {});
    return res.data;
  },

  async syncJira() {
    const res = await http.post("/sync/jira", {}, {});
    return res.data;
  },

  async syncGithub() {
    const res = await http.post("/sync/github", {}, {});
    return res.data;
  },
};
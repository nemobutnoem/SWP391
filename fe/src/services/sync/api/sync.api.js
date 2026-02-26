import { http } from "../../http/httpClient.js";

export const syncApi = {
  async syncAll(payload = {}) {
    console.log("[syncApi] POST /sync/all", payload);
    const res = await http.post("/sync/all", payload, {});
    console.log("[syncApi] /sync/all ->", res.data);
    return res.data;
  },

  async syncJira(payload = {}) {
    console.log("[syncApi] POST /sync/jira", payload);
    const res = await http.post("/sync/jira", payload, {});
    console.log("[syncApi] /sync/jira ->", res.data);
    return res.data;
  },

  async syncGithub(payload = {}) {
    console.log("[syncApi] POST /sync/github", payload);
    const res = await http.post("/sync/github", payload, {});
    console.log("[syncApi] /sync/github ->", res.data);
    return res.data;
  },
};
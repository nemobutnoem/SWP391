import { http } from "../../http/httpClient.js";

export const syncLogApi = {
  async list() {
    const res = await http.get("/sync-logs");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/sync-logs?groupId=${groupId}`);
    return res.data;
  },
};

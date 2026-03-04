import { http } from "../../http/httpClient.js";

export const topicApi = {
  async list() {
    const res = await http.get("/topics");
    return res.data;
  },

  async create(data) {
    const res = await http.post("/topics", data);
    return res.data;
  },

  async update(topicId, data) {
    const res = await http.put(`/topics/${topicId}`, data);
    return res.data;
  },

  async archive(topicId) {
    const res = await http.patch(`/topics/${topicId}/archive`);
    return res.data;
  },
};

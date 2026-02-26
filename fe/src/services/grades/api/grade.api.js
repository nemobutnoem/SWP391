import { http } from "../../http/httpClient.js";

export const gradeApi = {
  async list() {
    const res = await http.get("/grades");
    return res.data;
  },

  async listByGroup(groupId) {
    const res = await http.get(`/grades?groupId=${groupId}`);
    return res.data;
  },

  async listByLecturer(lecturerId) {
    const res = await http.get(`/grades?lecturerId=${lecturerId}`);
    return res.data;
  },

  async save(gradeId, data) {
    const res = await http.put(`/grades/${gradeId}`, data);
    return res.data;
  },
};

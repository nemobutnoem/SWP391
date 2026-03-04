import { http } from "../../http/httpClient.js";

export const studentApi = {
  async list() {
    const res = await http.get("/students");
    return res.data;
  },

  async getById(studentId) {
    const res = await http.get(`/students/${studentId}`);
    return res.data;
  },

  async create(data) {
    const res = await http.post("/students", data);
    return res.data;
  },

  async update(studentId, data) {
    const res = await http.put(`/students/${studentId}`, data);
    return res.data;
  },

  async remove(studentId) {
    const res = await http.delete(`/students/${studentId}`);
    return res.data;
  },
};

import { http } from "../../http/httpClient.js";

export const lecturerApi = {
  async list() {
    const res = await http.get("/lecturers");
    return res.data;
  },

  async getById(lecturerId) {
    const res = await http.get(`/lecturers/${lecturerId}`);
    return res.data;
  },

  async create(data) {
    const res = await http.post("/lecturers", data);
    return res.data;
  },

  async update(lecturerId, data) {
    const res = await http.put(`/lecturers/${lecturerId}`, data);
    return res.data;
  },

  async remove(lecturerId) {
    const res = await http.delete(`/lecturers/${lecturerId}`);
    return res.data;
  },
};

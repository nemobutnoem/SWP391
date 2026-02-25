import { http } from "../../http/httpClient.js";

export const projectApi = {
  async list() {
    const res = await http.get("/projects");
    return res.data;
  },

  async getByCourseOffering(courseOfferingId) {
    const res = await http.get(`/projects?courseOfferingId=${courseOfferingId}`);
    return res.data;
  },

  async getById(projectId) {
    const res = await http.get(`/projects/${projectId}`);
    return res.data;
  },
};

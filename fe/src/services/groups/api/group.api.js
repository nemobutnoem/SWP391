import { http } from "../../http/httpClient.js";

export const groupApi = {
  async list() {
    const res = await http.get("/groups");
    return res.data;
  },

  async listMembers() {
    const res = await http.get("/group-members");
    return res.data;
  },

  async getGroupDetail(groupId) {
    const res = await http.get(`/groups/${groupId}`);
    return res.data;
  },
  async listGroupMembers(groupId) {
    const res = await http.get(`/groups/${groupId}/members`);
    return res.data;
  },
};
import { http } from "../../http/httpClient.js";

export const groupApi = {
  async getGroupDetail(groupId) {
    const res = await http.get(`/groups/${groupId}`);
    return res.data;
  },
  async listGroupMembers(groupId) {
    const res = await http.get(`/groups/${groupId}/members`);
    return res.data;
  },
};
import { http } from "../../http/httpClient.js";

export const integrationApi = {
  async getByGroup(groupId) {
    const res = await http.get(`/groups/${groupId}/integrations`);
    return res.data;
  },
};
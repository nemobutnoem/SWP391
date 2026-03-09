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

  async assignLecturer(groupId, lecturerId) {
    const res = await http.put(`/groups/${groupId}/lecturer`, { lecturer_id: lecturerId });
    return res.data;
  },

  async assignTopicAdmin(groupId, projectId) {
    const res = await http.put(`/groups/${groupId}/topic/admin`, { project_id: projectId });
    return res.data;
  },

  async updateMemberRole(memberId, roleInGroup) {
    const res = await http.put(`/group-members/${memberId}/role`, { role_in_group: roleInGroup });
    return res.data;
  },
};
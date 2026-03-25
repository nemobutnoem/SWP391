import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const groupMock = {
  async list() {
    await sleep(200);
    return [...mockDb.groups];
  },

  async create(data) {
    await sleep(200);
    const newGroup = {
      id: Date.now(),
      ...data,
      status: "Active",
    };
    mockDb.groups.push(newGroup);
    return newGroup;
  },

  async listMembers() {
    await sleep(200);
    return [...mockDb.groupMembers];
  },

  async getGroupDetail(groupId) {
    await sleep(200);
    return mockDb.groups.find((g) => g.id === Number(groupId)) || null;
  },

  async listGroupMembers(groupId) {
    await sleep(250);

    const members = mockDb.groupMembers
      .filter((m) => m.group_id === Number(groupId))
      .map((m) => {
        const student = mockDb.students.find((s) => s.id === m.student_id);
        return {
          ...m,
          student,
        };
      });

    return members;
  },

  async updateMemberRole(memberId, roleInGroup) {
    await sleep(200);
    const member = mockDb.groupMembers.find((m) => m.id === Number(memberId));
    if (!member) throw new Error("Member not found");
    member.role_in_group = roleInGroup;
    return { ...member };
  },

  async addMember(groupId, studentId, roleInGroup = "Member") {
    await sleep(200);
    const newMember = {
      id: Date.now(),
      group_id: Number(groupId),
      student_id: Number(studentId),
      role_in_group: roleInGroup,
      status: "Active",
    };
    mockDb.groupMembers.push(newMember);
    return newMember;
  },

  async removeMember(groupId, memberId) {
    await sleep(200);
    const idx = mockDb.groupMembers.findIndex((m) => m.id === Number(memberId));
    if (idx >= 0) mockDb.groupMembers.splice(idx, 1);
  },

  async assignTopicAdmin(groupId, projectId) {
    await sleep(200);
    const group = mockDb.groups.find((g) => g.id === Number(groupId));
    if (!group) throw new Error("Group not found");
    group.project_id = Number(projectId);
    return { ...group };
  },

  async deleteGroup(groupId) {
    await sleep(200);
    const idx = mockDb.groups.findIndex((g) => g.id === Number(groupId));
    if (idx >= 0) mockDb.groups.splice(idx, 1);
  },
};

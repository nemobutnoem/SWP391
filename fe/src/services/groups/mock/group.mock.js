import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const groupMock = {
  async list() {
    await sleep(200);
    return [...mockDb.groups];
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
};
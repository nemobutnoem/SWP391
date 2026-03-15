import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const gradeMock = {
  async listByGroup(groupId) {
    await sleep(200);
    return mockDb.grades.filter((g) => g.group_id === Number(groupId));
  },

  async listByLecturer(lecturerId) {
    await sleep(200);
    return mockDb.grades.filter((g) => g.lecturer_id === Number(lecturerId));
  },

  async list() {
    await sleep(200);
    return [...mockDb.grades];
  },

  async save(gradeId, data) {
    await sleep(300);
    const existing = mockDb.grades.find((g) => g.id === Number(gradeId));
    if (!existing) throw new Error("Grade not found");
    Object.assign(existing, data, { status: "GRADED" });
    return { ...existing };
  },

  async create(data) {
    await sleep(300);
    const newId = Math.max(0, ...mockDb.grades.map((g) => g.id)) + 1;
    const record = { id: newId, score: null, feedback: null, status: "PENDING", ...data };
    mockDb.grades.push(record);
    return { ...record };
  },
};

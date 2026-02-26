import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const studentMock = {
  async list() {
    await sleep(200);
    return [...mockDb.students];
  },

  async getById(studentId) {
    await sleep(150);
    return mockDb.students.find((s) => s.id === Number(studentId)) || null;
  },

  async create(data) {
    await sleep(300);
    return { ...data, id: Date.now() };
  },

  async update(studentId, data) {
    await sleep(250);
    const existing = mockDb.students.find((s) => s.id === Number(studentId));
    if (!existing) throw new Error("Student not found");
    return { ...existing, ...data };
  },

  async remove(studentId) {
    await sleep(200);
    return { id: Number(studentId) };
  },
};

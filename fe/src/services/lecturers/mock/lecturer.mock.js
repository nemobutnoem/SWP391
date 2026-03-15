import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const lecturerMock = {
  async list() {
    await sleep(200);
    return [...mockDb.lecturers];
  },

  async getById(lecturerId) {
    await sleep(150);
    return mockDb.lecturers.find((l) => l.id === Number(lecturerId)) || null;
  },

  async create(data) {
    await sleep(300);
    return { ...data, id: Date.now() };
  },

  async update(lecturerId, data) {
    await sleep(250);
    const existing = mockDb.lecturers.find((l) => l.id === Number(lecturerId));
    if (!existing) throw new Error("Lecturer not found");
    return { ...existing, ...data };
  },

  async remove(lecturerId) {
    await sleep(200);
    return { id: Number(lecturerId) };
  },
};

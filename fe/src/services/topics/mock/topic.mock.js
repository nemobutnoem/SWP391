import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

const _localTopics = mockDb.topics ? [...mockDb.topics] : [];

export const topicMock = {
  async list() {
    await sleep(200);
    return [..._localTopics];
  },

  async create(data) {
    await sleep(300);
    return { ...data, id: Date.now() };
  },

  async update(topicId, data) {
    await sleep(250);
    const existing = _localTopics.find((t) => t.id === Number(topicId));
    if (!existing) throw new Error("Topic not found");
    return { ...existing, ...data };
  },

  async archive(topicId) {
    await sleep(200);
    return { id: Number(topicId), status: "ARCHIVED" };
  },
};

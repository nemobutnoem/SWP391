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
    const created = { ...data, id: Date.now() };
    _localTopics.push(created);
    return { ...created };
  },

  async update(topicId, data) {
    await sleep(250);
    const existing = _localTopics.find((t) => t.id === Number(topicId));
    if (!existing) throw new Error("Topic not found");
    Object.assign(existing, data);
    return { ...existing };
  },

  async archive(topicId) {
    await sleep(200);
    const existing = _localTopics.find((t) => t.id === Number(topicId));
    if (!existing) throw new Error("Topic not found");
    existing.status = "ARCHIVED";
    return { ...existing };
  },

  async checkUsage() {
    await sleep(150);
    return { inUse: false, groups: [] };
  },

  async remove(topicId) {
    await sleep(200);
    const idx = _localTopics.findIndex((t) => t.id === Number(topicId));
    if (idx < 0) throw new Error("Topic not found");
    _localTopics.splice(idx, 1);
  },
};

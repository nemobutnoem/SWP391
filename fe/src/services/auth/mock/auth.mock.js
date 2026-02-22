import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const authMock = {
  async getSession() {
    await sleep(150);
    return mockDb.session;
  },

  async loginFake({ role = "Student" } = {}) {
    await sleep(200);
    mockDb.session.user.role = role;
    return mockDb.session;
  },

  async logout() {
    await sleep(120);
    mockDb.session = null;
    return { ok: true };
  },
};
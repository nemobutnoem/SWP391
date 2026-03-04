import { sleep } from "../../mock/mockHttp.js";

const STORAGE_KEY = "swp_fake_auth";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    if (!value) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const authMock = {
  async getSession() {
    await sleep(80);
    return readStorage();
  },

  async loginFake({ role = "TEAM_MEMBER", name = "User" } = {}) {
    await sleep(120);
    const next = { user: { id: "fake-1", name: name || "User", role } };
    writeStorage(next);
    return next;
  },

  async logout() {
    await sleep(60);
    writeStorage(null);
    return { ok: true };
  },
};
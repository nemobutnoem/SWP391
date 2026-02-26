import { http } from "../../http/httpClient.js";
import { tokenStorage } from "../tokenStorage.js";

export const authApi = {
  async login({ account, password }) {
    const res = await http.post(
      "/auth/login",
      { account, password },
      { auth: false }
    );
    const accessToken = res.data?.accessToken || res.data?.token;
    if (accessToken) tokenStorage.set(accessToken);
    return res.data; // expect { user, ... }
  },

  async getSession() {
    // Backend does not expose a dedicated /me endpoint currently.
    return null;
  },

  async logout() {
    tokenStorage.clear();
    return { ok: true };
  },
};
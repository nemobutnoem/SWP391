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
    return res.data;
  },

  async loginWithGoogle({ credential, accountType }) {
    const res = await http.post(
      "/auth/google",
      { credential, account_type: accountType },
      { auth: false }
    );
    const accessToken = res.data?.accessToken || res.data?.token;
    if (accessToken) tokenStorage.set(accessToken);
    return res.data;
  },

  async getSession() {
    return null;
  },

  async logout() {
    tokenStorage.clear();
    return { ok: true };
  },
};

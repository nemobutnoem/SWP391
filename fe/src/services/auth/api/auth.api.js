import { http } from "../../http/httpClient.js";

export const authApi = {
  async getSession() {
    const res = await http.get("/auth/session");
    return res.data;
  },
  async login(payload) {
    const res = await http.post("/auth/login", payload);
    return res.data;
  },
  async logout() {
    const res = await http.post("/auth/logout", {});
    return res.data;
  },
};
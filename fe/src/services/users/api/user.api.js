import { http } from "../../http/httpClient.js";

export const userApi = {
  async list() {
    const res = await http.get("/users");
    return res.data;
  },
};

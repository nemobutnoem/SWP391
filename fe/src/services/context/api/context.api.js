import { http } from "../../http/httpClient.js";

export const contextApi = {
  async getMyContext() {
    const res = await http.get("/me/context");
    return res.data;
  },
};
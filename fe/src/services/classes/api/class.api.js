import { http } from "../../http/httpClient.js";

export const classApi = {
    list: async (semesterId) => {
        const url = semesterId ? `/classes?semester_id=${semesterId}` : "/classes";
        const res = await http.get(url);
        return res.data;
    },
    getById: async (id) => {
        const res = await http.get(`/classes/${id}`);
        return res.data;
    },
};

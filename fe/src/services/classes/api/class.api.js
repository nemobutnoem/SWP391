import { http } from "../../http/httpClient.js";

export const classApi = {
    list: async (semesterId) => {
        const url = semesterId ? `/api/classes?semester_id=${semesterId}` : "/api/classes";
        const res = await http.get(url);
        return res.data;
    },
    getById: async (id) => {
        const res = await http.get(`/api/classes/${id}`);
        return res.data;
    },
};

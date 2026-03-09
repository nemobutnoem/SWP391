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
    create: async (data) => {
        const res = await http.post("/classes", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await http.put(`/classes/${id}`, data);
        return res.data;
    },
    remove: async (id) => {
        const res = await http.delete(`/classes/${id}`);
        return res.data;
    },
};

import { http } from "../../http/httpClient.js";

export const semesterApi = {
    list: async () => {
        const res = await http.get("/semesters");
        return res.data;
    },
    getActive: async () => {
        const res = await http.get("/semesters/active");
        return res.data;
    },
    create: async (data) => {
        const res = await http.post("/semesters", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await http.put(`/semesters/${id}`, data);
        return res.data;
    },
    archive: async (id) => {
        const res = await http.patch(`/semesters/${id}/archive`);
        return res.data;
    },
    remove: async (id) => {
        const res = await http.delete(`/semesters/${id}`);
        return res.data;
    },
};

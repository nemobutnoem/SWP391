import { http } from "../../http/httpClient.js";

export const semesterApi = {
    list: async () => {
        const res = await http.get("/api/semesters");
        return res.data;
    },
    getActive: async () => {
        const res = await http.get("/api/semesters/active");
        return res.data;
    },
};

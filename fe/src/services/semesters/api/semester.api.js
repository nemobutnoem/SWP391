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
};

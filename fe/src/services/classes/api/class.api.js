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
    complete: async (id) => {
        const res = await http.put(`/classes/${id}/complete`);
        return res.data;
    },
    activate: async (id) => {
        const res = await http.put(`/classes/${id}/activate`);
        return res.data;
    },
    listEnrollments: async (classId) => {
        const res = await http.get(`/classes/${classId}/enrollments`);
        return res.data;
    },
    enroll: async (classId, studentId) => {
        const res = await http.post(`/classes/${classId}/enrollments`, { student_id: studentId });
        return res.data;
    },
    unenroll: async (classId, enrollmentId) => {
        const res = await http.delete(`/classes/${classId}/enrollments/${enrollmentId}`);
        return res.data;
    },
};

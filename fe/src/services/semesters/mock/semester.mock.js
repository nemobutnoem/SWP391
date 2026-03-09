let mockSemesters = [
    { id: 1, code: "SP26", name: "Spring 2026", status: "Active", start_date: "2026-01-15", end_date: "2026-05-30" }
];
let nextId = 2;

export const semesterMock = {
    list: async () => [...mockSemesters],
    getActive: async () => mockSemesters.find(s => s.status === "Active") || mockSemesters[0],
    create: async (data) => {
        const s = { id: nextId++, ...data };
        mockSemesters.push(s);
        return s;
    },
    update: async (id, data) => {
        mockSemesters = mockSemesters.map(s => s.id === id ? { ...s, ...data } : s);
        return mockSemesters.find(s => s.id === id);
    },
    remove: async (id) => {
        mockSemesters = mockSemesters.filter(s => s.id !== id);
    },
};

let mockClasses = [
    { id: 1, class_code: "SE1701", class_name: "Software Engineering 1701", semester_id: 1, major: "SE", status: "Active", lecturer_id: null },
    { id: 2, class_code: "SE1702", class_name: "Software Engineering 1702", semester_id: 1, major: "SE", status: "Active", lecturer_id: null }
];
let nextId = 3;

export const classMock = {
    list: async (semesterId) => {
        if (semesterId) return mockClasses.filter(c => c.semester_id === Number(semesterId));
        return [...mockClasses];
    },
    getById: async (id) => mockClasses.find(c => c.id === Number(id)),
    create: async (data) => {
        const c = { id: nextId++, ...data };
        mockClasses.push(c);
        return c;
    },
    update: async (id, data) => {
        mockClasses = mockClasses.map(c => c.id === Number(id) ? { ...c, ...data } : c);
        return mockClasses.find(c => c.id === Number(id));
    },
    remove: async (id) => {
        mockClasses = mockClasses.filter(c => c.id !== Number(id));
    },
    complete: async (id) => {
        mockClasses = mockClasses.map(c => c.id === Number(id) ? { ...c, status: "Completed" } : c);
        return mockClasses.find(c => c.id === Number(id));
    },
    activate: async (id) => {
        mockClasses = mockClasses.map(c => c.id === Number(id) ? { ...c, status: "Active" } : c);
        return mockClasses.find(c => c.id === Number(id));
    },
    listEnrollments: async () => [],
    enroll: async () => ({}),
    unenroll: async () => {},
};

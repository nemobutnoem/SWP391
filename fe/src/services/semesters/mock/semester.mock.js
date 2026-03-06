export const semesterMock = {
    list: async () => [
        { id: 1, name: "Spring 2026", status: "Active" }
    ],
    getActive: async () => ({ id: 1, name: "Spring 2026", status: "Active" }),
};

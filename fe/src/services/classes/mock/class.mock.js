export const classMock = {
    list: async (semesterId) => [
        { id: 1, class_code: "SE1701", class_name: "Software Engineering 1701", semester_id: semesterId || 1 },
        { id: 2, class_code: "SE1702", class_name: "Software Engineering 1702", semester_id: semesterId || 1 }
    ],
    getById: async (id) => ({ id, class_code: "SE1701", class_name: "Software Engineering 1701", semester_id: 1 })
};

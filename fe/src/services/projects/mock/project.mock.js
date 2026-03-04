import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const projectMock = {
  async list() {
    await sleep(200);
    return [...mockDb.projects];
  },

  async getByCourseOffering(courseOfferingId) {
    await sleep(200);
    return mockDb.projects.filter(
      (p) => p.course_offering_id === Number(courseOfferingId),
    );
  },

  async getById(projectId) {
    await sleep(150);
    return mockDb.projects.find((p) => p.id === Number(projectId)) || null;
  },
};

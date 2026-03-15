import { mockDb } from "../../mock/mockDb.js";
import { sleep } from "../../mock/mockHttp.js";

export const contextMock = {
  async getMyContext() {
    await sleep(200);

    const offering = mockDb.courseOfferings.find(
      (x) => x.id === mockDb.currentOfferingId
    );

    const course = offering
      ? mockDb.courses.find((c) => c.id === offering.course_id)
      : null;

    // mock: current user belongs to group 301
    const myGroup = mockDb.groups.find((g) => g.id === 301);

    const project = myGroup
      ? mockDb.projects.find((p) => p.id === myGroup.project_id)
      : null;

    return {
      course,
      offering,
      project,
      group: myGroup,
    };
  },
};
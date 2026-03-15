import { env } from "../../app/config/env.js";
import { projectMock } from "./mock/project.mock.js";
import { projectApi } from "./api/project.api.js";

export const projectService = env.useMock ? projectMock : projectApi;

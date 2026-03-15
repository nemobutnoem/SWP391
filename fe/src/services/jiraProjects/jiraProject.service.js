import { env } from "../../app/config/env.js";
import { jiraProjectMock } from "./mock/jiraProject.mock.js";
import { jiraProjectApi } from "./api/jiraProject.api.js";

export const jiraProjectService = env.useMock ? jiraProjectMock : jiraProjectApi;

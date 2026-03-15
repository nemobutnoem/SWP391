import { env } from "../../app/config/env.js";
import { jiraTaskMock } from "./mock/jiraTask.mock.js";
import { jiraTaskApi } from "./api/jiraTask.api.js";

export const jiraTaskService = env.useMock ? jiraTaskMock : jiraTaskApi;
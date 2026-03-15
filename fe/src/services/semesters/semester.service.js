import { env } from "../../app/config/env.js";
import { semesterApi } from "./api/semester.api.js";
import { semesterMock } from "./mock/semester.mock.js";

export const semesterService = env.useMock ? semesterMock : semesterApi;

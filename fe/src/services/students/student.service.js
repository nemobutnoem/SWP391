import { env } from "../../app/config/env.js";
import { studentMock } from "./mock/student.mock.js";
import { studentApi } from "./api/student.api.js";

export const studentService = env.useMock ? studentMock : studentApi;

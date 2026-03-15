import { env } from "../../app/config/env.js";
import { gradeMock } from "./mock/grade.mock.js";
import { gradeApi } from "./api/grade.api.js";

export const gradeService = env.useMock ? gradeMock : gradeApi;

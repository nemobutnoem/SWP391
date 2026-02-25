import { env } from "../../app/config/env.js";
import { lecturerMock } from "./mock/lecturer.mock.js";
import { lecturerApi } from "./api/lecturer.api.js";

export const lecturerService = env.useMock ? lecturerMock : lecturerApi;

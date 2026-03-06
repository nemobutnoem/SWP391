import { env } from "../../app/config/env.js";
import { classApi } from "./api/class.api.js";
import { classMock } from "./mock/class.mock.js";

export const classService = env.useMock ? classMock : classApi;

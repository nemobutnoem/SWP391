import { env } from "../../app/config/env.js";
import { contextMock } from "./mock/context.mock.js";
import { contextApi } from "./api/context.api.js";

export const contextService = env.useMock ? contextMock : contextApi;
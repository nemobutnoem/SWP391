import { env } from "../../app/config/env.js";
import { integrationMock } from "./mock/integration.mock.js";
import { integrationApi } from "./api/integration.api.js";

export const integrationService = env.useMock ? integrationMock : integrationApi;
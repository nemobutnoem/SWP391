import { env } from "../../app/config/env.js";
import { syncMock } from "./mock/sync.mock.js";
import { syncApi } from "./api/sync.api.js";

export const syncService = env.useMock ? syncMock : syncApi;
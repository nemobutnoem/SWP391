import { env } from "../../app/config/env.js";
import { syncLogMock } from "./mock/syncLog.mock.js";
import { syncLogApi } from "./api/syncLog.api.js";

export const syncLogService = env.useMock ? syncLogMock : syncLogApi;

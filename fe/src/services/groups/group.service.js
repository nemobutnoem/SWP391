import { env } from "../../app/config/env.js";
import { groupMock } from "./mock/group.mock.js";
import { groupApi } from "./api/group.api.js";

export const groupService = env.useMock ? groupMock : groupApi;
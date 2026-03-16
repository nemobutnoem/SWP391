import { env } from "../../app/config/env.js";
import { userMock } from "./mock/user.mock.js";
import { userApi } from "./api/user.api.js";

export const userService = env.useMock ? userMock : userApi;

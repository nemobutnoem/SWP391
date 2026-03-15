import { env } from "../../app/config/env.js";
import { authMock } from "./mock/auth.mock.js";
import { authApi } from "./api/auth.api.js";

export const authService = env.useMock ? authMock : authApi;
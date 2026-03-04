import { env } from "../../app/config/env.js";
import { githubActivityMock } from "./mock/githubActivity.mock.js";
import { githubActivityApi } from "./api/githubActivity.api.js";

export const githubActivityService = env.useMock
  ? githubActivityMock
  : githubActivityApi;
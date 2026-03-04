import { env } from "../../app/config/env.js";
import { githubRepositoryMock } from "./mock/githubRepository.mock.js";
import { githubRepositoryApi } from "./api/githubRepository.api.js";

export const githubRepositoryService = env.useMock
  ? githubRepositoryMock
  : githubRepositoryApi;

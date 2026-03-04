import { env } from "../../app/config/env.js";
import { topicMock } from "./mock/topic.mock.js";
import { topicApi } from "./api/topic.api.js";

export const topicService = env.useMock ? topicMock : topicApi;

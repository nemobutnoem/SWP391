package com.swp391.integration.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GroupIntegrationsResponse(
    @JsonProperty("groupId") Integer groupId,
    @JsonProperty("jiraBaseUrl") String jiraBaseUrl,
    @JsonProperty("jiraEmail") String jiraEmail,
    @JsonProperty("jiraApiTokenSet") boolean hasJiraToken,
    @JsonProperty("githubTokenSet") boolean hasGithubToken
) {}

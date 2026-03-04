package com.swp391.integration.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AdminIntegrationsResponse(
        @JsonProperty("jira_base_url") String jiraBaseUrl,
        @JsonProperty("jira_email") String jiraEmail,
        @JsonProperty("jira_api_token_set") boolean jiraApiTokenSet,
        @JsonProperty("github_token_set") boolean githubTokenSet) {
}

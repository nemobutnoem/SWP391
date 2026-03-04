package com.swp391.integration.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UpdateAdminIntegrationsRequest(
        @JsonProperty("jira_base_url") String jiraBaseUrl,
        @JsonProperty("jira_email") String jiraEmail,
        @JsonProperty("jira_api_token") String jiraApiToken,
        @JsonProperty("github_token") String githubToken) {
}

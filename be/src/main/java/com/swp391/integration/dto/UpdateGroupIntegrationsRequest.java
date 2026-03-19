package com.swp391.integration.dto;

public record UpdateGroupIntegrationsRequest(
    String jiraBaseUrl,
    String jiraEmail,
    String jiraApiToken,
    String githubToken
) {}

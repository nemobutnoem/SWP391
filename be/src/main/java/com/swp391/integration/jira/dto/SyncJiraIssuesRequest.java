package com.swp391.integration.jira.dto;

import jakarta.validation.constraints.NotBlank;

public record SyncJiraIssuesRequest(
		@NotBlank String projectKey
) {
}

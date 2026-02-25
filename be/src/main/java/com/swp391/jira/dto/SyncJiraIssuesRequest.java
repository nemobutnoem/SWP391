package com.swp391.jira.dto;

import jakarta.validation.constraints.NotBlank;

public record SyncJiraIssuesRequest(
		@NotBlank String projectKey
) {
}

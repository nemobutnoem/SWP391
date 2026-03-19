package com.swp391.integration.dto;

public record GroupIntegrationsResponse(
		Integer groupId,
		String jiraBaseUrl,
		String jiraEmail,
		boolean jiraApiTokenSet,
		boolean githubTokenSet
) {
}

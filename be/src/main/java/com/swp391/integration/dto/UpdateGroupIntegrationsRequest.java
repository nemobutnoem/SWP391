package com.swp391.integration.dto;

import jakarta.validation.constraints.Size;

public record UpdateGroupIntegrationsRequest(
		@Size(max = 255) String jiraBaseUrl,
		@Size(max = 255) String jiraEmail,
		@Size(max = 4000) String jiraApiToken,
		@Size(max = 4000) String githubToken
) {
}

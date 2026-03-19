package com.swp391.integration.dto;

<<<<<<< HEAD
import jakarta.validation.constraints.Size;

public record UpdateGroupIntegrationsRequest(
		@Size(max = 255) String jiraBaseUrl,
		@Size(max = 255) String jiraEmail,
		@Size(max = 4000) String jiraApiToken,
		@Size(max = 4000) String githubToken
) {
}
=======
public record UpdateGroupIntegrationsRequest(
    String jiraBaseUrl,
    String jiraEmail,
    String jiraApiToken,
    String githubToken
) {}
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca

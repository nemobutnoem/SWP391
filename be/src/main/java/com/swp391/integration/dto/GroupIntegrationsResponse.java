package com.swp391.integration.dto;

<<<<<<< HEAD
public record GroupIntegrationsResponse(
		Integer groupId,
		String jiraBaseUrl,
		String jiraEmail,
		boolean jiraApiTokenSet,
		boolean githubTokenSet
) {
}
=======
import com.fasterxml.jackson.annotation.JsonProperty;

public record GroupIntegrationsResponse(
    @JsonProperty("groupId") Integer groupId,
    @JsonProperty("jiraBaseUrl") String jiraBaseUrl,
    @JsonProperty("jiraEmail") String jiraEmail,
    @JsonProperty("jiraApiTokenSet") boolean hasJiraToken,
    @JsonProperty("githubTokenSet") boolean hasGithubToken
) {}
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca

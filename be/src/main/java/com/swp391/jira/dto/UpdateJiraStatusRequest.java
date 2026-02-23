package com.swp391.jira.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateJiraStatusRequest(
		@NotBlank String targetStatusName
) {
}

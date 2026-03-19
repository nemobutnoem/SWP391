package com.swp391.group.dto;

import jakarta.validation.constraints.NotNull;

public record SelectTopicRequest(
		@NotNull Integer projectId
) {
}

package com.swp391.repo.dto;

import jakarta.validation.constraints.NotBlank;

public record AddRepoRequest(
		@NotBlank String repoUrl
) {
}

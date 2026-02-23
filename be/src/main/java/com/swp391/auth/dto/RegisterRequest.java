package com.swp391.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
		@NotBlank String account,
		@NotBlank String password,
		@NotBlank String role
) {
}

package com.swp391.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
<<<<<<< HEAD
		@NotBlank String account,
		@NotBlank String password,
		@NotBlank String role
) {
}
=======
    @NotBlank String account,
    @NotBlank String password,
    @NotBlank String role
) {}
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca

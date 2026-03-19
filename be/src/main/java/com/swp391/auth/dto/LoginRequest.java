package com.swp391.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
<<<<<<< HEAD
		@NotBlank String account,
		@NotBlank String password
) {
}
=======
    @NotBlank String account,
    @NotBlank String password
) {}
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca

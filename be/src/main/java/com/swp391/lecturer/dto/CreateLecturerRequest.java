package com.swp391.lecturer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateLecturerRequest(
		@NotBlank(message = "Full name is required")
		@JsonProperty("full_name") String fullName,

		@Email(message = "Invalid email format")
		@JsonProperty("email") String email,

		@JsonProperty("status") String status
) {
}

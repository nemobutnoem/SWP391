package com.swp391.lecturer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;

public record UpdateLecturerRequest(
		@JsonProperty("full_name") String fullName,

		@Email(message = "Invalid email format")
		@JsonProperty("email") String email,

		@JsonProperty("status") String status
) {
}

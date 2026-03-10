package com.swp391.lecturer.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record UpdateLecturerRequest(
		@JsonProperty("full_name") String fullName,
		@JsonProperty("email") String email,
		@JsonProperty("department") String department,
		@JsonProperty("github_username") String githubUsername,
		@JsonProperty("status") String status) {
	@JsonCreator
	public UpdateLecturerRequest(
			@JsonProperty("full_name") @NotBlank(message = "Full name is required") String fullName,
			@JsonProperty("email") @NotBlank(message = "Email is required") @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z0-9._%+-]+@fu\\.edu\\.vn$", message = "Lecturer email must end with @fu.edu.vn") String email,
			@JsonProperty("department") String department,
			@JsonProperty("github_username") String githubUsername,
			@JsonProperty("status") String status) {
		this.fullName = fullName;
		this.email = email;
		this.department = department;
		this.githubUsername = githubUsername;
		this.status = status;
	}
}

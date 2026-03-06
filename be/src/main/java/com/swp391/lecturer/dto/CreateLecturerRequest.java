package com.swp391.lecturer.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateLecturerRequest(
		@JsonProperty("full_name") String fullName,
		@JsonProperty("email") String email,
		@JsonProperty("department") String department,
		@JsonProperty("github_username") String githubUsername,
		@JsonProperty("status") String status) {
	@JsonCreator
	public CreateLecturerRequest(
			@JsonProperty("full_name") @NotBlank(message = "Full name is required") String fullName,
			@JsonProperty("email") @Email(message = "Invalid email format") String email,
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

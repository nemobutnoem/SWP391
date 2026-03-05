package com.swp391.lecturer.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;

public record UpdateLecturerRequest(
		@JsonProperty("full_name") String fullName,
		@JsonProperty("email") String email,
		@JsonProperty("status") String status) {
	@JsonCreator
	public UpdateLecturerRequest(
			@JsonProperty("full_name") String fullName,
			@JsonProperty("email") @Email(message = "Invalid email format") String email,
			@JsonProperty("status") String status) {
		this.fullName = fullName;
		this.email = email;
		this.status = status;
	}
}

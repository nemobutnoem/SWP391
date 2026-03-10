package com.swp391.student.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record StudentUpsertRequest(
                @JsonProperty("user_id") Integer userId,
                @JsonProperty("class_id") Integer classId,

                @NotBlank(message = "Full name is required") @JsonProperty("full_name") String fullName,

                @NotBlank(message = "Student code is required") @JsonProperty("student_code") @Pattern(regexp = "^[A-Z]{2}\\d{6}$", message = "Student code must be 2 letters followed by 6 digits (e.g., SE123456)") String studentCode,

                @NotBlank(message = "Email is required") @Email(message = "Invalid email format") @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@(fpt\\.edu\\.vn|fe\\.edu\\.vn)$", message = "Email must be from @fpt.edu.vn or @fe.edu.vn domain") String email,

                String major,
                @NotBlank(message = "GitHub username is required") @JsonProperty("github_username") String githubUsername,
                @NotBlank(message = "Jira account ID is required") @JsonProperty("jira_account_id") String jiraAccountId,
                String status) {
}

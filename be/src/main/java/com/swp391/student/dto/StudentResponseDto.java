package com.swp391.student.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StudentResponseDto(
        Integer id,
        @JsonProperty("user_id") Integer userId,
        @JsonProperty("class_id") Integer classId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("student_code") String studentCode,
        String email,
        String major,
        @JsonProperty("github_username") String githubUsername,
        @JsonProperty("semester_id") Integer semesterId,
        String status) {
}

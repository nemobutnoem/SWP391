package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AssignLecturerRequest(
        @JsonProperty("lecturer_id") Integer lecturerId) {
}

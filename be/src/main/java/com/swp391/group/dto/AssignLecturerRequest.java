package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AssignLecturerRequest(
                @JsonProperty("lecturer_id") Integer lecturerId) {
        @JsonCreator
        public AssignLecturerRequest(@JsonProperty("lecturer_id") Integer lecturerId) {
                this.lecturerId = lecturerId;
        }
}

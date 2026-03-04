package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateGroupRequest(
        @NotNull(message = "Semester ID is required") @JsonProperty("semester_id") Integer semesterId,

        @NotNull(message = "Class ID is required") @JsonProperty("class_id") Integer classId,

        @NotBlank(message = "Group code is required") @JsonProperty("group_code") String groupCode,

        @NotBlank(message = "Group name is required") @JsonProperty("group_name") String groupName,

        @JsonProperty("description") String description) {
}

package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateGroupRequest(
                @JsonProperty("semester_id") Integer semesterId,
                @JsonProperty("class_id") Integer classId,
                @JsonProperty("group_code") String groupCode,
                @JsonProperty("group_name") String groupName,
                @JsonProperty("description") String description) {
        @JsonCreator
        public CreateGroupRequest(
                        @JsonProperty("semester_id") @NotNull(message = "Semester ID is required") Integer semesterId,
                        @JsonProperty("class_id") @NotNull(message = "Class ID is required") Integer classId,
                        @JsonProperty("group_code") 
                        @NotBlank(message = "Group code is required") 
                        @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Group code can only contain letters, numbers, hyphens, and underscores") 
                        String groupCode,
                        @JsonProperty("group_name") @NotBlank(message = "Group name is required") String groupName,
                        @JsonProperty("description") String description) {
                this.semesterId = semesterId;
                this.classId = classId;
                this.groupCode = groupCode;
                this.groupName = groupName;
                this.description = description;
        }
}

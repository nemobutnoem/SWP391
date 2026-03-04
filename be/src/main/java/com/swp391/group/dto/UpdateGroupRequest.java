package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UpdateGroupRequest(
        @JsonProperty("group_code") String groupCode,
        @JsonProperty("group_name") String groupName,
        @JsonProperty("description") String description,
        @JsonProperty("status") String status) {
}

package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AssignTopicRequest(
        @JsonProperty("project_id") Integer projectId) {
    @JsonCreator
    public AssignTopicRequest(@JsonProperty("project_id") Integer projectId) {
        this.projectId = projectId;
    }
}

package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GroupMemberDto(
        @JsonProperty("group_id") Integer groupId,
        @JsonProperty("student_id") Integer studentId,
        Integer userId,
        String fullName,
        String email,
        String account,
        @JsonProperty("jira_account_id") String jiraAccountId,
        @JsonProperty("role_in_group") String roleInGroup
) {
}

package com.swp391.group.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GroupSummary(
		Integer id,
		@JsonProperty("group_code") String groupCode,
		@JsonProperty("group_name") String groupName,
		@JsonProperty("semester_id") Integer semesterId,
		@JsonProperty("class_id") Integer classId,
		@JsonProperty("project_id") Integer projectId,
		@JsonProperty("leader_student_id") Integer leaderStudentId,
		@JsonProperty("lecturer_id") Integer lecturerId,
		String description,
		String status) {
}

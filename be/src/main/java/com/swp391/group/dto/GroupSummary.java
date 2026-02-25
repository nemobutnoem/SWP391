package com.swp391.group.dto;

public record GroupSummary(
		Integer id,
		String groupCode,
		String groupName,
		Integer semesterId,
		Integer classId,
		Integer projectId,
		Integer leaderStudentId
) {
}

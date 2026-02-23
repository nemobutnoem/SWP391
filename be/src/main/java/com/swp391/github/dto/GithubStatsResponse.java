package com.swp391.github.dto;

import java.util.Map;

public record GithubStatsResponse(
		Integer groupId,
		Map<String, Integer> commitsByGithubUsername
) {
}

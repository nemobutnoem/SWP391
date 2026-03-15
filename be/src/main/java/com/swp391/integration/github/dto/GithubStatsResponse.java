package com.swp391.integration.github.dto;

import java.util.Map;

public record GithubStatsResponse(
		Integer groupId,
		Map<String, Integer> commitsByGithubUsername
) {
}

package com.swp391.integration.github;

import com.swp391.integration.github.dto.GithubStatsResponse;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/groups/{groupId}/github")
@RequiredArgsConstructor
public class GithubController {
	private final GithubService githubService;

	@GetMapping("/stats")
	public GithubStatsResponse stats(
			@PathVariable("groupId") Integer groupId,
			@RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
			Authentication auth
	) {
		return githubService.stats(groupId, from, to, (UserPrincipal) auth.getPrincipal());
	}

	@PostMapping("/sync")
	public int sync(@PathVariable("groupId") Integer groupId, Authentication auth) {
		return githubService.syncCommits(groupId, (UserPrincipal) auth.getPrincipal());
	}
}

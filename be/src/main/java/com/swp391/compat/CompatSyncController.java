package com.swp391.compat;

import com.swp391.github.GithubService;
import com.swp391.group.GroupMemberRepository;
import com.swp391.jira.JiraProjectRepository;
import com.swp391.jira.JiraService;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class CompatSyncController {
	private final JiraService jiraService;
	private final GithubService githubService;
	private final JiraProjectRepository jiraProjectRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record SyncRequest(Integer groupId, String projectKey) {
	}

	private List<Integer> resolveGroupIds(UserPrincipal principal, Integer groupIdOverride) {
		if (groupIdOverride != null) {
			return List.of(groupIdOverride);
		}
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		return memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> m.getGroupId())
				.distinct()
				.toList();
	}

	private static Map<String, Object> resultRow(Integer groupId, boolean ok, String message, Map<String, Object> extra) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("groupId", groupId);
		row.put("ok", ok);
		if (message != null) row.put("message", message);
		if (extra != null) row.putAll(extra);
		return row;
	}

	@PostMapping("/all")
	public Map<String, Object> syncAll(@RequestBody(required = false) SyncRequest request, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		Integer groupIdOverride = request == null ? null : request.groupId();
		String projectKeyOverride = request == null ? null : request.projectKey();

		Instant startedAt = Instant.now();
		List<Map<String, Object>> jiraResults = new ArrayList<>();
		List<Map<String, Object>> githubResults = new ArrayList<>();
		boolean allOk = true;
		int jiraUpsertedTotal = 0;
		int githubInsertedTotal = 0;

		for (Integer groupId : resolveGroupIds(principal, groupIdOverride)) {
			// Jira
			try {
				String projectKey = jiraProjectRepository.findByGroupId(groupId)
						.map(jp -> jp.getJiraProjectKey())
						.filter(s -> s != null && !s.isBlank())
						.orElse(projectKeyOverride);
				if (projectKey == null || projectKey.isBlank()) {
					jiraResults.add(resultRow(groupId, false, "Missing Jira project key for this group", Map.of()));
					allOk = false;
				} else {
					int upserted = jiraService.syncIssues(groupId, projectKey.trim(), principal);
					jiraUpsertedTotal += upserted;
					jiraResults.add(resultRow(groupId, true, "Synced Jira issues", Map.of("upserted", upserted, "projectKey", projectKey.trim())));
				}
			} catch (Exception ex) {
				jiraResults.add(resultRow(groupId, false, ex.getMessage(), Map.of()));
				allOk = false;
			}

			// GitHub
			try {
				int inserted = githubService.syncCommits(groupId, principal);
				githubInsertedTotal += inserted;
				githubResults.add(resultRow(groupId, true, "Synced GitHub commits", Map.of("inserted", inserted)));
			} catch (Exception ex) {
				githubResults.add(resultRow(groupId, false, ex.getMessage(), Map.of()));
				allOk = false;
			}
		}

		return Map.of(
				"ok", allOk,
				"startedAt", startedAt.toString(),
				"finishedAt", Instant.now().toString(),
				"jira", Map.of(
						"totalUpserted", jiraUpsertedTotal,
						"results", jiraResults
				),
				"github", Map.of(
						"totalInserted", githubInsertedTotal,
						"results", githubResults
				)
		);
	}

	@PostMapping("/jira")
	public Map<String, Object> syncJira(@RequestBody(required = false) SyncRequest request, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		Integer groupIdOverride = request == null ? null : request.groupId();
		String projectKeyOverride = request == null ? null : request.projectKey();
		Instant startedAt = Instant.now();

		List<Map<String, Object>> results = new ArrayList<>();
		boolean allOk = true;
		int totalUpserted = 0;
		for (Integer groupId : resolveGroupIds(principal, groupIdOverride)) {
			try {
				String projectKey = jiraProjectRepository.findByGroupId(groupId)
						.map(jp -> jp.getJiraProjectKey())
						.filter(s -> s != null && !s.isBlank())
						.orElse(projectKeyOverride);
				if (projectKey == null || projectKey.isBlank()) {
					results.add(resultRow(groupId, false, "Missing Jira project key for this group", Map.of()));
					allOk = false;
					continue;
				}
				int upserted = jiraService.syncIssues(groupId, projectKey.trim(), principal);
				totalUpserted += upserted;
				results.add(resultRow(groupId, true, "Synced Jira issues", Map.of("upserted", upserted, "projectKey", projectKey.trim())));
			} catch (Exception ex) {
				results.add(resultRow(groupId, false, ex.getMessage(), Map.of()));
				allOk = false;
			}
		}

		return Map.of(
				"ok", allOk,
				"startedAt", startedAt.toString(),
				"finishedAt", Instant.now().toString(),
				"totalUpserted", totalUpserted,
				"results", results
		);
	}

	@PostMapping("/github")
	public Map<String, Object> syncGithub(@RequestBody(required = false) SyncRequest request, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		Integer groupIdOverride = request == null ? null : request.groupId();
		Instant startedAt = Instant.now();

		List<Map<String, Object>> results = new ArrayList<>();
		boolean allOk = true;
		int totalInserted = 0;
		for (Integer groupId : resolveGroupIds(principal, groupIdOverride)) {
			try {
				int inserted = githubService.syncCommits(groupId, principal);
				totalInserted += inserted;
				results.add(resultRow(groupId, true, "Synced GitHub commits", Map.of("inserted", inserted)));
			} catch (Exception ex) {
				results.add(resultRow(groupId, false, ex.getMessage(), Map.of()));
				allOk = false;
			}
		}

		return Map.of(
				"ok", allOk,
				"startedAt", startedAt.toString(),
				"finishedAt", Instant.now().toString(),
				"totalInserted", totalInserted,
				"results", results
		);
	}
}

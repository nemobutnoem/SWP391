package com.swp391.compat;

import com.swp391.github.GithubService;
import com.swp391.group.GroupMemberRepository;
import com.swp391.jira.JiraProjectRepository;
import com.swp391.jira.JiraService;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.swp391.sync.OutboundSyncLogEntity;
import com.swp391.sync.OutboundSyncLogRepository;
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
	private final OutboundSyncLogRepository outboundSyncLogRepository;

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

	private void writeSyncLog(UserPrincipal principal, Integer groupId, String target, String action, String remoteId, boolean ok, String errorMessage) {
		OutboundSyncLogEntity log = new OutboundSyncLogEntity();
		log.setTarget(target);
		log.setEntityType("Group");
		log.setEntityLocalId(groupId);
		log.setRemoteId(remoteId);
		log.setAction(action);
		log.setRequestedByUserId(principal.getUserId());
		log.setStatus(ok ? "SUCCESS" : "FAILED");
		log.setErrorMessage(ok ? null : errorMessage);
		outboundSyncLogRepository.save(log);
	}

	private static String summarizeFailures(List<Map<String, Object>>... resultLists) {
		int failed = 0;
		String first = null;
		for (List<Map<String, Object>> list : resultLists) {
			if (list == null) continue;
			for (Map<String, Object> row : list) {
				Object okObj = row.get("ok");
				boolean ok = okObj instanceof Boolean b && b;
				if (!ok) {
					failed++;
					if (first == null) {
						Object msg = row.get("message");
						first = msg == null ? null : String.valueOf(msg);
					}
				}
			}
		}
		if (failed <= 0) return null;
		if (first == null || first.isBlank()) {
			return "Some sync operations failed (" + failed + ")";
		}
		return "Some sync operations failed (" + failed + "): " + first;
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
					String msg = "Missing Jira project key for this group";
					jiraResults.add(resultRow(groupId, false, msg, Map.of()));
					writeSyncLog(principal, groupId, "jira", "sync_issues", null, false, msg);
					allOk = false;
				} else {
					int upserted = jiraService.syncIssues(groupId, projectKey.trim(), principal);
					jiraUpsertedTotal += upserted;
					jiraResults.add(resultRow(groupId, true, "Synced Jira issues", Map.of("upserted", upserted, "projectKey", projectKey.trim())));
					writeSyncLog(principal, groupId, "jira", "sync_issues", projectKey.trim(), true, null);
				}
			} catch (Exception ex) {
				String msg = ex.getMessage();
				jiraResults.add(resultRow(groupId, false, msg, Map.of()));
				writeSyncLog(principal, groupId, "jira", "sync_issues", projectKeyOverride, false, msg);
				allOk = false;
			}

			// GitHub
			try {
				int inserted = githubService.syncCommits(groupId, principal);
				githubInsertedTotal += inserted;
				githubResults.add(resultRow(groupId, true, "Synced GitHub commits", Map.of("inserted", inserted)));
				writeSyncLog(principal, groupId, "github", "sync_commits", null, true, null);
			} catch (Exception ex) {
				String msg = ex.getMessage();
				githubResults.add(resultRow(groupId, false, msg, Map.of()));
				writeSyncLog(principal, groupId, "github", "sync_commits", null, false, msg);
				allOk = false;
			}
		}

		String message = allOk ? null : summarizeFailures(jiraResults, githubResults);
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("ok", allOk);
		if (message != null) payload.put("message", message);
		payload.put("startedAt", startedAt.toString());
		payload.put("finishedAt", Instant.now().toString());
		payload.put("jira", Map.of(
				"totalUpserted", jiraUpsertedTotal,
				"results", jiraResults
		));
		payload.put("github", Map.of(
				"totalInserted", githubInsertedTotal,
				"results", githubResults
		));
		return payload;
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
					String msg = "Missing Jira project key for this group";
					results.add(resultRow(groupId, false, msg, Map.of()));
					writeSyncLog(principal, groupId, "jira", "sync_issues", null, false, msg);
					allOk = false;
					continue;
				}
				int upserted = jiraService.syncIssues(groupId, projectKey.trim(), principal);
				totalUpserted += upserted;
				results.add(resultRow(groupId, true, "Synced Jira issues", Map.of("upserted", upserted, "projectKey", projectKey.trim())));
				writeSyncLog(principal, groupId, "jira", "sync_issues", projectKey.trim(), true, null);
			} catch (Exception ex) {
				String msg = ex.getMessage();
				results.add(resultRow(groupId, false, msg, Map.of()));
				writeSyncLog(principal, groupId, "jira", "sync_issues", projectKeyOverride, false, msg);
				allOk = false;
			}
		}

		String message = allOk ? null : summarizeFailures(results);
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("ok", allOk);
		if (message != null) payload.put("message", message);
		payload.put("startedAt", startedAt.toString());
		payload.put("finishedAt", Instant.now().toString());
		payload.put("totalUpserted", totalUpserted);
		payload.put("results", results);
		return payload;
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
				writeSyncLog(principal, groupId, "github", "sync_commits", null, true, null);
			} catch (Exception ex) {
				String msg = ex.getMessage();
				results.add(resultRow(groupId, false, msg, Map.of()));
				writeSyncLog(principal, groupId, "github", "sync_commits", null, false, msg);
				allOk = false;
			}
		}

		String message = allOk ? null : summarizeFailures(results);
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("ok", allOk);
		if (message != null) payload.put("message", message);
		payload.put("startedAt", startedAt.toString());
		payload.put("finishedAt", Instant.now().toString());
		payload.put("totalInserted", totalInserted);
		payload.put("results", results);
		return payload;
	}
}

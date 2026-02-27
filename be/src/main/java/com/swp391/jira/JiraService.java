package com.swp391.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.swp391.group.GroupMemberRepository;
import com.swp391.integration.GroupIntegrationService;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.swp391.sync.OutboundSyncLogEntity;
import com.swp391.sync.OutboundSyncLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JiraService {
	private final JiraClient jiraClient;
	private final JiraIssueRepository jiraIssueRepository;
	private final JiraProjectRepository jiraProjectRepository;
	private final OutboundSyncLogRepository outboundSyncLogRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;
	private final GroupIntegrationService integrationService;

	public java.util.List<JiraIssueEntity> listIssues(Integer groupId, UserPrincipal principal) {
		ensureMember(groupId, principal);
		return jiraIssueRepository.findByGroupId(groupId);
	}

	@Transactional
	public int syncIssues(Integer groupId, String projectKey, UserPrincipal principal) {
		ensureMember(groupId, principal);

		jiraProjectRepository.findByGroupId(groupId).ifPresentOrElse(
				jp -> {
					// Keep the configured key if present; otherwise allow request key.
					if (jp.getJiraProjectKey() != null && !jp.getJiraProjectKey().isBlank()) {
						// no-op
					}
				},
				() -> {
					// no Jira_Project row yet; that's okay for read-only sync.
				}
		);

		var cfg = integrationService.resolveJiraConfig(groupId);
		if (cfg.baseUrl() == null || cfg.email() == null || cfg.apiToken() == null) {
			throw new IllegalStateException("Jira integration is not configured for this group");
		}
		String jql = "project = " + projectKey + " ORDER BY updated DESC";
		int upserted = 0;
		java.util.Set<String> seenIssueKeys = new java.util.HashSet<>();
		String nextPageToken = null;
		boolean isLast = false;
		do {
			var search = jiraClient.searchIssues(cfg.baseUrl(), cfg.email(), cfg.apiToken(), jql, nextPageToken, 100);
			// Jira may return results under `issues` (classic search) or `values` (enhanced search).
			JsonNode issuesNode = search.path("issues");
			if (issuesNode == null || !issuesNode.isArray()) {
				issuesNode = search.path("values");
			}
			if (issuesNode != null && issuesNode.isArray()) {
				for (var issueNode : issuesNode) {
				String jiraIssueId = issueNode.path("id").asText();
				String jiraIssueKey = issueNode.path("key").asText();
				if (jiraIssueKey != null && !jiraIssueKey.isBlank()) {
					seenIssueKeys.add(jiraIssueKey);
				}
				var fields = issueNode.path("fields");
				String summary = fields.path("summary").asText(null);
				String issueType = fields.path("issuetype").path("name").asText(null);
				String status = fields.path("status").path("name").asText(null);
				String dueDate = fields.path("duedate").asText(null);
				String updated = fields.path("updated").asText(null);
				java.time.LocalDateTime jiraUpdatedAt = null;
				try {
					if (updated != null && !updated.isBlank()) {
						jiraUpdatedAt = java.time.LocalDateTime.ofInstant(java.time.Instant.parse(updated), java.time.ZoneOffset.UTC);
					}
				} catch (Exception ignored) {
					// Best-effort only.
				}

				java.time.LocalDate jiraDueDate = null;
				try {
					if (dueDate != null && !dueDate.isBlank()) {
						jiraDueDate = java.time.LocalDate.parse(dueDate);
					}
				} catch (Exception ignored) {
					// Best-effort only.
				}

				var entity = jiraIssueRepository.findByGroupIdAndJiraIssueId(groupId, jiraIssueId)
						.or(() -> jiraIssueRepository.findByGroupIdAndJiraIssueKey(groupId, jiraIssueKey))
						.orElseGet(JiraIssueEntity::new);
				entity.setGroupId(groupId);
				entity.setJiraIssueId(jiraIssueId);
				entity.setJiraIssueKey(jiraIssueKey);
				entity.setIssueType(issueType == null ? "" : issueType);
				entity.setSummary(summary);
				entity.setStatus(status);
				entity.setJiraDueDate(jiraDueDate);
				entity.setJiraUpdatedAt(jiraUpdatedAt);
				jiraIssueRepository.save(entity);
				upserted++;
				}
			}

			isLast = search.path("isLast").asBoolean(false);
			String tokenFromResponse = search.path("nextPageToken").asText(null);
			nextPageToken = (tokenFromResponse == null || tokenFromResponse.isBlank()) ? null : tokenFromResponse;
		} while (!isLast && nextPageToken != null);

		// IMPORTANT: If an issue was deleted in Jira, it will no longer show up in search results.
		// Our local DB is a cache, so we need to prune missing issues to keep the web UI consistent.
		// Only do this after we have finished paging through the whole result set.
		var existing = jiraIssueRepository.findByGroupId(groupId);
		var toDelete = existing.stream()
				.filter(e -> e.getJiraIssueKey() != null && !e.getJiraIssueKey().isBlank())
				.filter(e -> !seenIssueKeys.contains(e.getJiraIssueKey()))
				.toList();
		if (!toDelete.isEmpty()) {
			jiraIssueRepository.deleteAll(toDelete);
		}
		return upserted;
	}

	@Transactional
	public void pushStatus(Integer groupId, String issueKey, String targetStatusName, UserPrincipal principal) {
		ensureMember(groupId, principal);
		var issue = jiraIssueRepository.findByGroupIdAndJiraIssueKey(groupId, issueKey)
				.orElseThrow(() -> new IllegalArgumentException("Issue not found locally for this group"));

		var cfg = integrationService.resolveJiraConfig(groupId);
		if (cfg.baseUrl() == null || cfg.email() == null || cfg.apiToken() == null) {
			throw new IllegalStateException("Jira integration is not configured for this group");
		}

		OutboundSyncLogEntity log = new OutboundSyncLogEntity();
		log.setTarget("jira");
		log.setEntityType("Jira_Issue");
		log.setEntityLocalId(issue.getId());
		log.setRemoteId(issueKey);
		log.setAction("transition_status");
		log.setRequestedByUserId(principal.getUserId());
		log.setStatus("PENDING");
		log = outboundSyncLogRepository.save(log);

		try {
			JsonNode transitions = jiraClient.getIssueTransitions(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey);
			JsonNode chosen = null;
			for (JsonNode t : transitions.path("transitions")) {
				String toName = t.path("to").path("name").asText(null);
				if (toName != null && toName.equalsIgnoreCase(targetStatusName)) {
					chosen = t;
					break;
				}
			}
			if (chosen == null) {
				throw new IllegalArgumentException("No Jira transition found to status: " + targetStatusName);
			}
			String transitionId = chosen.path("id").asText();
			jiraClient.transitionIssue(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey, transitionId);
			log.setStatus("SUCCESS");
			outboundSyncLogRepository.save(log);
		} catch (Exception ex) {
			log.setStatus("FAILED");
			log.setErrorMessage(ex.getMessage());
			outboundSyncLogRepository.save(log);
			throw ex;
		}
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}


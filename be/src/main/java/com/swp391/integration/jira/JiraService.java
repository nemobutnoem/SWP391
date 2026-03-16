package com.swp391.integration.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.swp391.group.GroupMemberRepository;
import com.swp391.integration.GroupIntegrationService;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.swp391.integration.sync.OutboundSyncLogEntity;
import com.swp391.integration.sync.OutboundSyncLogRepository;
import com.swp391.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class JiraService {
	private static final Logger log = LoggerFactory.getLogger(JiraService.class);
	private final JiraClient jiraClient;
	private final JiraIssueRepository jiraIssueRepository;
	private final JiraProjectRepository jiraProjectRepository;
	private final OutboundSyncLogRepository outboundSyncLogRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;
	private final GroupIntegrationService integrationService;
	private final UserRepository userRepository;
	private final TaskCommentRepository taskCommentRepository;

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
				String description = extractTextFromAdf(fields.path("description"));
				String issueType = fields.path("issuetype").path("name").asText(null);
				String status = fields.path("status").path("name").asText(null);
				String assigneeAccountId = fields.path("assignee").path("accountId").asText(null);
				String assigneeDisplayName = fields.path("assignee").path("displayName").asText(null);
				String priority = fields.path("priority").path("name").asText(null);
				String dueDate = fields.path("duedate").asText(null);
				String updated = fields.path("updated").asText(null);
				String created = fields.path("created").asText(null);

				// Reporter
				String reporterAccountId = fields.path("reporter").path("accountId").asText(null);
				String reporterDisplayName = fields.path("reporter").path("displayName").asText(null);

				// Parent issue
				String parentIssueKey = fields.path("parent").path("key").asText(null);

				// Labels
				var labelsNode = fields.path("labels");
				String labelsStr = null;
				if (labelsNode != null && labelsNode.isArray() && labelsNode.size() > 0) {
					var labelList = new java.util.ArrayList<String>();
					for (var ln : labelsNode) labelList.add(ln.asText());
					labelsStr = String.join(",", labelList);
				}

				// Sprint (customfield_10020 is the standard Jira sprint field)
				String sprintName = null;
				var sprintNode = fields.path("sprint");
				if (sprintNode != null && !sprintNode.isMissingNode() && !sprintNode.isNull()) {
					sprintName = sprintNode.path("name").asText(null);
				}
				// Fallback: customfield_10020 (array of sprint objects)
				if (sprintName == null) {
					var sprintArrayNode = fields.path("customfield_10020");
					if (sprintArrayNode != null && sprintArrayNode.isArray() && sprintArrayNode.size() > 0) {
						// Take the last (most recent/active) sprint
						sprintName = sprintArrayNode.get(sprintArrayNode.size() - 1).path("name").asText(null);
					}
				}

				// Story points: customfield_10016 (standard) or story_points
				Double storyPoints = null;
				var spNode = fields.path("story_points");
				if (spNode == null || spNode.isMissingNode() || spNode.isNull()) {
					spNode = fields.path("customfield_10016");
				}
				if (spNode != null && !spNode.isMissingNode() && !spNode.isNull()) {
					try { storyPoints = spNode.asDouble(); } catch (Exception ignored) {}
				}
				java.time.LocalDateTime jiraUpdatedAt = null;
				try {
					if (updated != null && !updated.isBlank()) {
						jiraUpdatedAt = java.time.LocalDateTime.ofInstant(java.time.Instant.parse(updated), java.time.ZoneOffset.UTC);
					}
				} catch (Exception ignored) {
					// Best-effort only.
				}

				java.time.LocalDateTime jiraCreatedAt = null;
				try {
					if (created != null && !created.isBlank()) {
						jiraCreatedAt = java.time.LocalDateTime.ofInstant(java.time.Instant.parse(created), java.time.ZoneOffset.UTC);
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
				entity.setDescription(description);
				entity.setStatus(status);
					entity.setPriority(priority);
					Integer assigneeUserId = null;
					if (assigneeAccountId != null && !assigneeAccountId.isBlank()) {
						assigneeUserId = userRepository.findByJiraAccountId(assigneeAccountId)
								.map(u -> u.getId())
								.orElse(null);

						// Fallback: fetch Jira user to get email, map to student, and persist jira_account_id
						if (assigneeUserId == null) {
							try {
								var jiraUser = jiraClient.getUser(cfg.baseUrl(), cfg.email(), cfg.apiToken(), assigneeAccountId);
								String emailAddr = jiraUser.path("emailAddress").asText(null);
								if (emailAddr != null && !emailAddr.isBlank()) {
									var studentOpt = studentRepository.findByEmailIgnoreCase(emailAddr);
									if (studentOpt.isPresent()) {
										var student = studentOpt.get();
										var userOpt = userRepository.findById(student.getUserId());
										if (userOpt.isPresent()) {
											var u = userOpt.get();
											u.setJiraAccountId(assigneeAccountId);
											userRepository.save(u);
											assigneeUserId = u.getId();
										}
									}
								}
							} catch (Exception ex) {
								log.warn("[syncIssues] Unable to resolve assignee by email for accountId={}: {}", assigneeAccountId, ex.getMessage());
							}
						}
					}
					entity.setAssigneeUserId(assigneeUserId);
					entity.setAssigneeDisplayName(assigneeDisplayName);
				// Reporter
				Integer reporterUserId = null;
				if (reporterAccountId != null && !reporterAccountId.isBlank()) {
					reporterUserId = userRepository.findByJiraAccountId(reporterAccountId)
							.map(u -> u.getId())
							.orElse(null);
				}
				entity.setReporterUserId(reporterUserId);
				entity.setReporterDisplayName(reporterDisplayName);
				entity.setParentIssueKey(parentIssueKey);
				entity.setLabels(labelsStr);
				entity.setSprintName(sprintName);
				entity.setStoryPoints(storyPoints);
				entity.setJiraCreatedAt(jiraCreatedAt);
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

		// Sync comments for each issue
		var allIssues = jiraIssueRepository.findByGroupId(groupId);
		for (var issue : allIssues) {
			if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
				try {
					syncComments(issue, cfg);
				} catch (Exception ex) {
					log.warn("[syncIssues] Failed to sync comments for {}: {}", issue.getJiraIssueKey(), ex.getMessage());
				}
			}
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

	@Transactional
	public void pushAssignee(Integer groupId, String issueKey, Integer assigneeUserId, UserPrincipal principal) {
		ensureMember(groupId, principal);
		var issue = jiraIssueRepository.findByGroupIdAndJiraIssueKey(groupId, issueKey)
				.orElseThrow(() -> new IllegalArgumentException("Issue not found locally for this group"));

		var cfg = integrationService.resolveJiraConfig(groupId);
		if (cfg.baseUrl() == null || cfg.email() == null || cfg.apiToken() == null) {
			throw new IllegalStateException("Jira integration is not configured for this group");
		}

		String accountId = null;
		String resolvedFrom = null;
		if (assigneeUserId != null) {
			var user = userRepository.findById(assigneeUserId)
					.orElseThrow(() -> new IllegalArgumentException("Assignee user not found"));
			accountId = resolveAndPersistAccountId(cfg, user);
			resolvedFrom = (accountId != null && !accountId.equals(user.getJiraAccountId())) ? "refreshed" : "stored";

			if (accountId == null || accountId.isBlank()) {
				throw new IllegalArgumentException("Selected user does not have a valid Jira accountId (could not resolve from email/account)");
			}
		}

		OutboundSyncLogEntity syncLog = new OutboundSyncLogEntity();
		syncLog.setTarget("jira");
		syncLog.setEntityType("Jira_Issue");
		syncLog.setEntityLocalId(issue.getId());
		syncLog.setRemoteId(issueKey);
		syncLog.setAction("assign_assignee");
		syncLog.setRequestedByUserId(principal.getUserId());
		syncLog.setStatus("PENDING");
		syncLog = outboundSyncLogRepository.save(syncLog);

		try {
			jiraClient.assignIssue(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey, accountId);
			syncLog.setStatus("SUCCESS");
			outboundSyncLogRepository.save(syncLog);
		} catch (Exception ex) {
			if (ex instanceof RestClientResponseException rc) {
				// Jira 404 commonly means accountId not assignable or not found in project
				String msg = rc.getResponseBodyAsString();
				log.warn("[pushAssignee] Jira rejected assign: status={}, issueKey={}, accountId={}, resolvedFrom={}, body={}",
						rc.getStatusCode(), issueKey, accountId, resolvedFrom, msg);

				// Fallback: try to re-resolve accountId and retry once (handles stale stored accountId)
				if (assigneeUserId != null) {
					var user = userRepository.findById(assigneeUserId).orElse(null);
					String fallbackAccountId = resolveAndPersistAccountId(cfg, user);
					if (fallbackAccountId != null && !fallbackAccountId.equals(accountId)) {
						log.info("[pushAssignee] Retry assign with resolved accountId={}, old={}", fallbackAccountId, accountId);
						try {
							jiraClient.assignIssue(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey, fallbackAccountId);
							syncLog.setStatus("SUCCESS");
							outboundSyncLogRepository.save(syncLog);
							return;
						} catch (RestClientResponseException rc2) {
							log.warn("[pushAssignee] Retry failed: status={}, body={}", rc2.getStatusCode(), rc2.getResponseBodyAsString());
						} catch (Exception ex2) {
							log.warn("[pushAssignee] Retry failed: {}", ex2.getMessage());
						}
					}
				}

				throw new IllegalArgumentException(
						"Jira rejected assignee (issue=" + issueKey + ", accountId=" + accountId + "): " +
								"user not found or not assignable to the project. " +
								"Check jira_account_id, user is in the project People list, and permission 'Assignable User'. " +
								"Jira said: " + msg);
			}
			syncLog.setStatus("FAILED");
			syncLog.setErrorMessage(ex.getMessage());
			outboundSyncLogRepository.save(syncLog);
			throw ex;
		}
	}

	private String resolveAndPersistAccountId(GroupIntegrationService.JiraConfig cfg, com.swp391.user.UserEntity user) {
		if (user == null) return null;
		// If already stored and looks like an Atlassian accountId (no '@' and length > 10), prefer it
		String stored = user.getJiraAccountId();
		if (stored != null && !stored.isBlank() && !stored.contains("@") && stored.length() > 8) {
			return stored;
		}

		String searchQuery = null;
		var student = studentRepository.findByUserId(user.getId()).orElse(null);
		if (student != null && student.getEmail() != null && !student.getEmail().isBlank()) {
			searchQuery = student.getEmail();
		} else if (user.getAccount() != null && !user.getAccount().isBlank()) {
			searchQuery = user.getAccount();
		}
		if (searchQuery == null) return null;
		try {
			var users = jiraClient.searchUsers(cfg.baseUrl(), cfg.email(), cfg.apiToken(), searchQuery);
			if (users.isArray() && users.size() > 0) {
				String resolved = users.get(0).path("accountId").asText(null);
				if (resolved != null && !resolved.isBlank()) {
					user.setJiraAccountId(resolved);
					userRepository.save(user);
					return resolved;
				}
			}
		} catch (Exception ignored) {
		}
		return null;
	}

	@Transactional
	public void pushFields(Integer groupId, String issueKey, java.util.Map<String, Object> fields, UserPrincipal principal) {
		ensureMember(groupId, principal);
		var issue = jiraIssueRepository.findByGroupIdAndJiraIssueKey(groupId, issueKey)
				.orElseThrow(() -> new IllegalArgumentException("Issue not found locally for this group"));

		var cfg = integrationService.resolveJiraConfig(groupId);
		if (cfg.baseUrl() == null || cfg.email() == null || cfg.apiToken() == null) {
			throw new IllegalStateException("Jira integration is not configured for this group");
		}

		if (fields == null || fields.isEmpty()) {
			throw new IllegalArgumentException("No fields to update");
		}

		OutboundSyncLogEntity log = new OutboundSyncLogEntity();
		log.setTarget("jira");
		log.setEntityType("Jira_Issue");
		log.setEntityLocalId(issue.getId());
		log.setRemoteId(issueKey);
		log.setAction("update_fields");
		log.setRequestedByUserId(principal.getUserId());
		log.setStatus("PENDING");
		log = outboundSyncLogRepository.save(log);

		try {
			jiraClient.updateIssueFields(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey, fields);
			log.setStatus("SUCCESS");
			outboundSyncLogRepository.save(log);
		} catch (Exception ex) {
			log.setStatus("FAILED");
			log.setErrorMessage(ex.getMessage());
			outboundSyncLogRepository.save(log);
			throw ex;
		}
	}

	@Transactional
	public void pushComment(Integer groupId, String issueKey, String commentText, UserPrincipal principal) {
		log.info("[pushComment] groupId={}, issueKey={}, userId={}", groupId, issueKey, principal.getUserId());

		var issue = jiraIssueRepository.findByGroupIdAndJiraIssueKey(groupId, issueKey)
				.orElse(null);
		if (issue == null) {
			log.warn("[pushComment] No local issue found for groupId={}, issueKey={}", groupId, issueKey);
			return;
		}

		var cfg = integrationService.resolveJiraConfig(groupId);
		if (cfg.baseUrl() == null || cfg.email() == null || cfg.apiToken() == null) {
			log.warn("[pushComment] Jira not configured for groupId={}", groupId);
			return;
		}
		log.info("[pushComment] Using Jira baseUrl={}, email={}", cfg.baseUrl(), cfg.email());

		OutboundSyncLogEntity syncLog = new OutboundSyncLogEntity();
		syncLog.setTarget("jira");
		syncLog.setEntityType("Jira_Comment");
		syncLog.setEntityLocalId(issue.getId());
		syncLog.setRemoteId(issueKey);
		syncLog.setAction("add_comment");
		syncLog.setRequestedByUserId(principal.getUserId());
		syncLog.setStatus("PENDING");
		syncLog = outboundSyncLogRepository.save(syncLog);

		try {
			jiraClient.addComment(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issueKey, commentText);
			syncLog.setStatus("SUCCESS");
			outboundSyncLogRepository.save(syncLog);
			log.info("[pushComment] SUCCESS for issueKey={}", issueKey);
		} catch (Exception ex) {
			syncLog.setStatus("FAILED");
			syncLog.setErrorMessage(ex.getMessage());
			outboundSyncLogRepository.save(syncLog);
			log.error("[pushComment] FAILED for issueKey={}: {}", issueKey, ex.getMessage(), ex);
		}
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}

	private void syncComments(JiraIssueEntity issue, GroupIntegrationService.JiraConfig cfg) {
		var commentsJson = jiraClient.getComments(cfg.baseUrl(), cfg.email(), cfg.apiToken(), issue.getJiraIssueKey());
		var commentsNode = commentsJson.path("comments");
		if (commentsNode == null || !commentsNode.isArray()) return;

		for (var c : commentsNode) {
			String jiraCommentId = c.path("id").asText(null);
			if (jiraCommentId == null || jiraCommentId.isBlank()) continue;

			// Skip if already synced
			if (taskCommentRepository.findByJiraCommentId(jiraCommentId).isPresent()) continue;

			// Extract plain text from ADF body
			String content = extractTextFromAdf(c.path("body"));
			if (content == null || content.isBlank()) continue;

			// Map Jira author to local user
			String authorAccountId = c.path("author").path("accountId").asText(null);
			String authorDisplayName = c.path("author").path("displayName").asText(null);
			Integer userId = null;
			if (authorAccountId != null && !authorAccountId.isBlank()) {
				userId = userRepository.findByJiraAccountId(authorAccountId)
						.map(u -> u.getId())
						.orElse(null);
			}

			// Parse created timestamp
			java.time.LocalDateTime createdAt = null;
			String created = c.path("created").asText(null);
			if (created != null) {
				try {
					createdAt = java.time.LocalDateTime.ofInstant(
							java.time.Instant.parse(created), java.time.ZoneOffset.UTC);
				} catch (Exception ignored) {
					// Jira sometimes uses non-ISO format
					try {
						createdAt = java.time.LocalDateTime.parse(created,
								java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ"));
					} catch (Exception ignored2) {
						createdAt = java.time.LocalDateTime.now();
					}
				}
			}

			var entity = new TaskCommentEntity();
			entity.setTaskId(issue.getId());
			entity.setUserId(userId);
			entity.setContent(content);
			entity.setJiraCommentId(jiraCommentId);
			entity.setJiraAuthorName(authorDisplayName);
			entity.setCreatedAt(createdAt);
			entity.setUpdatedAt(createdAt);
			taskCommentRepository.save(entity);
			log.info("[syncComments] Synced comment {} for issue {}", jiraCommentId, issue.getJiraIssueKey());
		}
	}

	private String extractTextFromAdf(JsonNode body) {
		if (body == null || body.isMissingNode()) return "";
		// ADF: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "..." }] }] }
		if (body.isTextual()) return body.asText();
		var sb = new StringBuilder();
		extractTextRecursive(body, sb);
		return sb.toString().trim();
	}

	private void extractTextRecursive(JsonNode node, StringBuilder sb) {
		if (node == null || node.isMissingNode()) return;
		if (node.has("text")) {
			sb.append(node.path("text").asText());
		}
		var content = node.path("content");
		if (content.isArray()) {
			for (var child : content) {
				extractTextRecursive(child, sb);
			}
			// Add newline after paragraph-level blocks
			if ("paragraph".equals(node.path("type").asText(null))) {
				sb.append("\n");
			}
		}
	}
}


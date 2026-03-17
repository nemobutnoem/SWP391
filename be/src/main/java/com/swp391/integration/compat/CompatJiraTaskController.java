package com.swp391.integration.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.group.GroupMemberRepository;
import com.swp391.integration.jira.JiraIssueEntity;
import com.swp391.integration.jira.JiraIssueRepository;
import com.swp391.integration.jira.JiraService;
import com.swp391.integration.jira.TaskCommentEntity;
import com.swp391.integration.jira.TaskCommentRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.swp391.user.UserEntity;
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatJiraTaskController {
	private static final Logger log = LoggerFactory.getLogger(CompatJiraTaskController.class);
	private final JiraIssueRepository jiraIssueRepository;
	private final JiraService jiraService;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;
	private final UserRepository userRepository;
	private final com.swp391.group.StudentGroupRepository groupRepository;
	private final com.swp391.lecturer.LecturerRepository lecturerRepository;
	private final TaskCommentRepository taskCommentRepository;

	public record JiraTaskDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("jira_issue_key") String jiraIssueKey,
			String title,
			String summary,
			String description,
			String status,
			String priority,
			@JsonProperty("issue_type") String issueType,
			LocalDate dueDate,
			Integer assigneeUserId,
			String assigneeName,
			Integer reporterUserId,
			String reporterName,
			@JsonProperty("parent_issue_key") String parentIssueKey,
			String labels,
			@JsonProperty("sprint_name") String sprintName,
			@JsonProperty("story_points") Double storyPoints,
			@JsonProperty("jira_created_at") java.time.LocalDateTime jiraCreatedAt,
			@JsonProperty("jira_updated_at") java.time.LocalDateTime jiraUpdatedAt) {
	}

	public record UpdateTaskRequest(
			String status,
			@JsonProperty("assigneeUserId") Integer assigneeUserId,
			@JsonProperty("assignee_user_id") Integer assigneeUserIdSnake,
			String dueDate,
			@JsonProperty("due_date") String dueDateSnake,
			String priority) {
	}

	@GetMapping("/jira-tasks")
	public List<JiraTaskDto> list(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();

		Set<Integer> groupIds;

		if ("Admin".equalsIgnoreCase(role)) {
			// Admin sees all tasks
			return jiraIssueRepository.findAll().stream()
					.sorted(Comparator.comparing(JiraIssueEntity::getId))
					.map(this::toDto)
					.toList();
		} else if ("Lecturer".equalsIgnoreCase(role)) {
			// Lecturer sees tasks from groups assigned to them
			groupIds = resolveGroupIdsForLecturer(principal);
		} else {
			// Student: tasks from their groups
			var student = studentRepository.findByUserId(principal.getUserId()).orElse(null);
			if (student == null)
				return List.of();
			groupIds = memberRepository.findByStudentId(student.getId()).stream()
					.map(m -> m.getGroupId())
					.collect(Collectors.toSet());
		}

		if (groupIds.isEmpty())
			return List.of();
		return groupIds.stream()
				.flatMap(gid -> jiraIssueRepository.findByGroupId(gid).stream())
				.sorted(Comparator.comparing(JiraIssueEntity::getId))
				.map(this::toDto)
				.toList();
	}

	@GetMapping("/groups/{groupId}/jira-tasks")
	public List<JiraTaskDto> listByGroup(@PathVariable Integer groupId, Authentication auth) {
		ensureMember(groupId, (UserPrincipal) auth.getPrincipal());
		return jiraIssueRepository.findByGroupId(groupId).stream().map(this::toDto).toList();
	}

	@PatchMapping("/jira-tasks/{taskId}")
	public JiraTaskDto updateTask(@PathVariable Integer taskId, @Valid @RequestBody UpdateTaskRequest req,
			Authentication auth) {
		var issue = jiraIssueRepository.findById(taskId)
				.orElseThrow(() -> new IllegalArgumentException("Jira task not found"));
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		ensureMember(issue.getGroupId(), principal);

		boolean changed = false;
		boolean isTeamMember = "TEAM_MEMBER".equalsIgnoreCase(principal.getRole());

		if (req.status() != null && !req.status().isBlank()) {
			// Push status to Jira as well (so Jira changes, not just local DB).
			// Convert common app statuses like IN_PROGRESS -> "In Progress" for Jira
			// workflows.
			String jiraStatusName = toJiraStatusName(req.status());
			if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
				jiraService.pushStatus(issue.getGroupId(), issue.getJiraIssueKey(), jiraStatusName, principal);
			}
			issue.setStatus(jiraStatusName);
			changed = true;
		}

		Integer assigneeUserId = req.assigneeUserId() != null ? req.assigneeUserId() : req.assigneeUserIdSnake();
		if (assigneeUserId != null) {
			if (isTeamMember) {
				throw new SecurityException("TEAM_MEMBER can only update task status");
			}
			// 0 (or negative) means "unassigned" from UI.
			Integer normalizedAssignee = assigneeUserId <= 0 ? null : assigneeUserId;
			if (normalizedAssignee != null) {
				var student = studentRepository.findByUserId(normalizedAssignee)
						.orElseThrow(() -> new IllegalArgumentException("Assignee is not a student"));
				memberRepository.findByGroupIdAndStudentId(issue.getGroupId(), student.getId())
						.orElseThrow(() -> new SecurityException("Assignee is not a member of this group"));
			}
			if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
				jiraService.pushAssignee(issue.getGroupId(), issue.getJiraIssueKey(), normalizedAssignee, principal);
			}
			issue.setAssigneeUserId(normalizedAssignee);
			changed = true;
		}

		String dueDateRaw = req.dueDate() != null ? req.dueDate() : req.dueDateSnake();
		if (dueDateRaw != null || req.priority() != null) {
			if (isTeamMember) {
				throw new SecurityException("TEAM_MEMBER can only update task status");
			}
			java.util.Map<String, Object> fields = new java.util.LinkedHashMap<>();

			if (dueDateRaw != null) {
				LocalDate parsed = null;
				String s = dueDateRaw.trim();
				if (!s.isEmpty()) {
					try {
						parsed = LocalDate.parse(s);
					} catch (Exception ex) {
						throw new IllegalArgumentException("Invalid dueDate, expected yyyy-MM-dd");
					}
				}
				fields.put("duedate", parsed == null ? null : parsed.toString());
				issue.setJiraDueDate(parsed);
			}

			if (req.priority() != null) {
				String p = req.priority().trim();
				if (p.isEmpty()) {
					fields.put("priority", null);
					issue.setPriority(null);
				} else {
					fields.put("priority", java.util.Map.of("name", p));
					issue.setPriority(p);
				}
			}

			if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
				jiraService.pushFields(issue.getGroupId(), issue.getJiraIssueKey(), fields, principal);
			}
			changed = true;
		}

		if (!changed) {
			throw new IllegalArgumentException("No changes requested");
		}
		return toDto(jiraIssueRepository.save(issue));
	}

	private static String toJiraStatusName(String raw) {
		String v = raw == null ? "" : raw.trim();
		if (v.isEmpty())
			return v;
		String upper = v.toUpperCase();
		// Common mapping for Jira default workflows
		if (upper.equals("TODO") || upper.equals("TO_DO") || upper.equals("TO DO"))
			return "To Do";
		if (upper.equals("IN_PROGRESS") || upper.equals("IN PROGRESS") || upper.equals("INPROGRESS"))
			return "In Progress";
		if (upper.equals("IN_REVIEW") || upper.equals("IN REVIEW") || upper.equals("INREVIEW"))
			return "In Review";
		if (upper.equals("DONE"))
			return "Done";

		// Fallback: make it title case and replace underscores.
		String spaced = v.replace('_', ' ').replaceAll("\\s+", " ").trim();
		String[] parts = spaced.split(" ");
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < parts.length; i++) {
			String p = parts[i];
			if (p.isEmpty())
				continue;
			String lower = p.toLowerCase();
			String word = Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
			if (sb.length() > 0)
				sb.append(' ');
			sb.append(word);
		}
		return sb.length() == 0 ? v : sb.toString();
	}

	private JiraTaskDto toDto(JiraIssueEntity e) {
		String title = e.getSummary();
		String assigneeName = null;
		if (e.getAssigneeUserId() != null) {
			assigneeName = userRepository.findById(e.getAssigneeUserId())
					.map(u -> u.getAccount())
					.orElse(null);
		}
		if (assigneeName == null && e.getAssigneeDisplayName() != null) {
			assigneeName = e.getAssigneeDisplayName();
		}
		String reporterName = null;
		if (e.getReporterUserId() != null) {
			reporterName = userRepository.findById(e.getReporterUserId())
					.map(u -> u.getAccount())
					.orElse(null);
		}
		if (reporterName == null && e.getReporterDisplayName() != null) {
			reporterName = e.getReporterDisplayName();
		}
		return new JiraTaskDto(
				e.getId(),
				e.getGroupId(),
				e.getJiraIssueKey(),
				title,
				e.getSummary(),
				e.getDescription(),
				e.getStatus(),
				e.getPriority(),
				e.getIssueType(),
				e.getJiraDueDate(),
				e.getAssigneeUserId(),
				assigneeName,
				e.getReporterUserId(),
				reporterName,
				e.getParentIssueKey(),
				e.getLabels(),
				e.getSprintName(),
				e.getStoryPoints(),
				e.getJiraCreatedAt(),
				e.getJiraUpdatedAt());
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		String role = principal.getRole();
		if ("Admin".equalsIgnoreCase(role)) {
			return;
		}
		if ("Lecturer".equalsIgnoreCase(role)) {
			if (!resolveGroupIdsForLecturer(principal).contains(groupId)) {
				throw new SecurityException("You are not assigned to this group");
			}
			return;
		}
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}

	private Set<Integer> resolveGroupIdsForLecturer(UserPrincipal principal) {
		var lecturer = lecturerRepository.findByUserId(principal.getUserId()).orElse(null);
		if (lecturer == null)
			return Set.of();
		return groupRepository.findAll().stream()
				.filter(g -> lecturer.getId().equals(g.getLecturerId()))
				.map(g -> g.getId())
				.collect(Collectors.toSet());
	}

	// ── Task Comments ──────────────────────────────────────────

	public record TaskCommentDto(
			Integer id,
			Integer taskId,
			Integer userId,
			String userName,
			String content,
			String createdAt) {
	}

	public record CreateCommentRequest(@NotBlank String content) {
	}

	@GetMapping("/jira-tasks/{taskId}/comments")
	public List<TaskCommentDto> listComments(@PathVariable Integer taskId, Authentication auth) {
		jiraIssueRepository.findById(taskId)
				.orElseThrow(() -> new IllegalArgumentException("Task not found"));
		return taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
				.map(this::toCommentDto)
				.toList();
	}

	@PostMapping("/jira-tasks/{taskId}/comments")
	public TaskCommentDto addComment(@PathVariable Integer taskId,
			@Valid @RequestBody CreateCommentRequest req, Authentication auth) {
		var issue = jiraIssueRepository.findById(taskId)
				.orElseThrow(() -> new IllegalArgumentException("Task not found"));
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		var comment = new TaskCommentEntity();
		comment.setTaskId(taskId);
		comment.setUserId(principal.getUserId());
		comment.setContent(req.content());
		var saved = taskCommentRepository.save(comment);

		// Push comment to Jira (best-effort, won't fail the request)
		if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
			log.info("[addComment] Pushing comment to Jira: taskId={}, issueKey={}, groupId={}",
					taskId, issue.getJiraIssueKey(), issue.getGroupId());
			try {
				jiraService.pushComment(issue.getGroupId(), issue.getJiraIssueKey(), req.content(), principal);
			} catch (Exception e) {
				log.error("[addComment] Jira push failed: {}", e.getMessage(), e);
			}
		} else {
			log.warn("[addComment] No Jira issue key for taskId={}, skipping push", taskId);
		}

		return toCommentDto(saved);
	}

	private TaskCommentDto toCommentDto(TaskCommentEntity c) {
		String userName;
		if (c.getUserId() != null) {
			userName = userRepository.findById(c.getUserId())
					.map(UserEntity::getAccount)
					.orElse(c.getJiraAuthorName() != null ? c.getJiraAuthorName() : "Unknown");
		} else {
			userName = c.getJiraAuthorName() != null ? c.getJiraAuthorName() : "Jira User";
		}
		return new TaskCommentDto(
				c.getId(),
				c.getTaskId(),
				c.getUserId(),
				userName,
				c.getContent(),
				c.getCreatedAt() == null ? null : c.getCreatedAt().toString());
	}
}

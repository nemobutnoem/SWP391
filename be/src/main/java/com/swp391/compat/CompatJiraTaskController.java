package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.group.GroupMemberRepository;
import com.swp391.jira.JiraIssueEntity;
import com.swp391.jira.JiraIssueRepository;
import com.swp391.jira.JiraService;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
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
	private final JiraIssueRepository jiraIssueRepository;
	private final JiraService jiraService;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record JiraTaskDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("jira_issue_key") String jiraIssueKey,
			String title,
			String summary,
			String description,
			String status,
			LocalDate dueDate
	) {
	}

	public record UpdateStatusRequest(@NotBlank String status) {
	}

	@GetMapping("/jira-tasks")
	public List<JiraTaskDto> list(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		Set<Integer> groupIds = memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> m.getGroupId())
				.collect(Collectors.toSet());
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
	public JiraTaskDto updateStatus(@PathVariable Integer taskId, @Valid @RequestBody UpdateStatusRequest req, Authentication auth) {
		var issue = jiraIssueRepository.findById(taskId)
				.orElseThrow(() -> new IllegalArgumentException("Jira task not found"));
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		ensureMember(issue.getGroupId(), principal);

		// Push status to Jira as well (so Jira changes, not just local DB).
		// Convert common app statuses like IN_PROGRESS -> "In Progress" for Jira workflows.
		String jiraStatusName = toJiraStatusName(req.status());
		if (issue.getJiraIssueKey() != null && !issue.getJiraIssueKey().isBlank()) {
			jiraService.pushStatus(issue.getGroupId(), issue.getJiraIssueKey(), jiraStatusName, principal);
		}

		issue.setStatus(jiraStatusName);
		return toDto(jiraIssueRepository.save(issue));
	}

	private static String toJiraStatusName(String raw) {
		String v = raw == null ? "" : raw.trim();
		if (v.isEmpty()) return v;
		String upper = v.toUpperCase();
		// Common mapping for Jira default workflows
		if (upper.equals("TODO") || upper.equals("TO_DO") || upper.equals("TO DO")) return "To Do";
		if (upper.equals("IN_PROGRESS") || upper.equals("IN PROGRESS") || upper.equals("INPROGRESS")) return "In Progress";
		if (upper.equals("IN_REVIEW") || upper.equals("IN REVIEW") || upper.equals("INREVIEW")) return "In Review";
		if (upper.equals("DONE")) return "Done";

		// Fallback: make it title case and replace underscores.
		String spaced = v.replace('_', ' ').replaceAll("\\s+", " ").trim();
		String[] parts = spaced.split(" ");
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < parts.length; i++) {
			String p = parts[i];
			if (p.isEmpty()) continue;
			String lower = p.toLowerCase();
			String word = Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
			if (sb.length() > 0) sb.append(' ');
			sb.append(word);
		}
		return sb.length() == 0 ? v : sb.toString();
	}

	private JiraTaskDto toDto(JiraIssueEntity e) {
		String title = e.getSummary();
		return new JiraTaskDto(
				e.getId(),
				e.getGroupId(),
				e.getJiraIssueKey(),
				title,
				e.getSummary(),
				e.getDescription(),
			e.getStatus(),
			e.getJiraDueDate()
		);
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}

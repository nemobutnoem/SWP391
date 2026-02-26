package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.group.GroupMemberRepository;
import com.swp391.jira.JiraIssueEntity;
import com.swp391.jira.JiraIssueRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatJiraTaskController {
	private final JiraIssueRepository jiraIssueRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record JiraTaskDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("jira_issue_key") String jiraIssueKey,
			String title,
			String summary,
			String description,
			String status
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
		ensureMember(issue.getGroupId(), (UserPrincipal) auth.getPrincipal());
		issue.setStatus(req.status());
		return toDto(jiraIssueRepository.save(issue));
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
				e.getStatus()
		);
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}

package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.group.GroupMemberRepository;
import com.swp391.jira.JiraProjectEntity;
import com.swp391.jira.JiraProjectRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Compatibility endpoints to match FE expectations.
 *
 * FE calls:
 * - GET /api/jira-projects
 * - GET /api/jira-projects?groupId=1
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatJiraProjectController {
	private final JiraProjectRepository jiraProjectRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record JiraProjectDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("jira_project_key") String jiraProjectKey,
			@JsonProperty("jira_project_id") String jiraProjectId,
			@JsonProperty("jira_base_url") String jiraBaseUrl,
			@JsonProperty("project_name") String projectName,
			String status
	) {
	}

	@GetMapping("/jira-projects")
	public List<JiraProjectDto> list(
			@RequestParam(name = "groupId", required = false) Integer groupId,
			Authentication auth
	) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

		if (groupId != null) {
			ensureMember(groupId, principal);
			return jiraProjectRepository.findByGroupId(groupId)
					.stream()
					.map(this::toDto)
					.toList();
		}

		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		Set<Integer> groupIds = memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> m.getGroupId())
				.collect(Collectors.toSet());

		return groupIds.stream()
				.flatMap(gid -> jiraProjectRepository.findByGroupId(gid).stream())
				.sorted(Comparator.comparing(JiraProjectEntity::getId))
				.map(this::toDto)
				.toList();
	}

	private JiraProjectDto toDto(JiraProjectEntity e) {
		return new JiraProjectDto(
				e.getId(),
				e.getGroupId(),
				e.getJiraProjectKey(),
				e.getJiraProjectId(),
				e.getJiraBaseUrl(),
				e.getProjectName(),
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

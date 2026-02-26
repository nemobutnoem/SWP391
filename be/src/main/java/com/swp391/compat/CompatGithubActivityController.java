package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.github.GithubActivityEntity;
import com.swp391.github.GithubActivityRepository;
import com.swp391.group.GroupMemberRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatGithubActivityController {
	private final GithubActivityRepository activityRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record GithubActivityDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("github_username") String githubUsername,
			@JsonProperty("activity_type") String activityType,
			@JsonProperty("commit_message") String commitMessage,
			@JsonProperty("ref_name") String refName,
			@JsonProperty("pushed_commit_count") Integer pushedCommitCount,
			@JsonProperty("occurred_at") String occurredAt
	) {
	}

	@GetMapping("/github-activities")
	public List<GithubActivityDto> list(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		Set<Integer> groupIds = memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> m.getGroupId())
				.collect(Collectors.toSet());
		return groupIds.stream()
				.flatMap(gid -> activityRepository.findByGroupId(gid).stream())
				.sorted(Comparator.comparing(GithubActivityEntity::getId))
				.map(this::toDto)
				.toList();
	}

	@GetMapping("/groups/{groupId}/github-activities")
	public List<GithubActivityDto> listByGroup(@PathVariable Integer groupId, Authentication auth) {
		ensureMember(groupId, (UserPrincipal) auth.getPrincipal());
		return activityRepository.findByGroupId(groupId).stream().map(this::toDto).toList();
	}

	private GithubActivityDto toDto(GithubActivityEntity e) {
		String occurredAt = null;
		if (e.getOccurredAt() != null) {
			// Best-effort ISO-ish timestamp; FE tolerates formats.
			occurredAt = e.getOccurredAt().toInstant(ZoneOffset.UTC).toString();
		}
		return new GithubActivityDto(
				e.getId(),
				e.getGroupId(),
				e.getGithubUsername(),
				e.getActivityType(),
				e.getCommitMessage(),
				e.getRefName(),
				e.getPushedCommitCount(),
				occurredAt
		);
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}

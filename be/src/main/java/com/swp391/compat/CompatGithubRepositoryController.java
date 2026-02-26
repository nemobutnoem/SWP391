package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.group.GroupMemberRepository;
import com.swp391.repo.GithubRepositoryEntity;
import com.swp391.repo.GithubRepositoryRepository;
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
 * - GET /api/github-repositories
 * - GET /api/github-repositories?groupId=1
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatGithubRepositoryController {
	private final GithubRepositoryRepository repoRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public record GithubRepositoryDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("repo_url") String repoUrl,
			@JsonProperty("repo_owner") String repoOwner,
			@JsonProperty("repo_name") String repoName,
			@JsonProperty("default_branch") String defaultBranch
	) {
	}

	@GetMapping("/github-repositories")
	public List<GithubRepositoryDto> list(
			@RequestParam(name = "groupId", required = false) Integer groupId,
			Authentication auth
	) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

		if (groupId != null) {
			ensureMember(groupId, principal);
			return repoRepository.findByGroupId(groupId).stream().map(this::toDto).toList();
		}

		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		Set<Integer> groupIds = memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> m.getGroupId())
				.collect(Collectors.toSet());

		return groupIds.stream()
				.flatMap(gid -> repoRepository.findByGroupId(gid).stream())
				.sorted(Comparator.comparing(GithubRepositoryEntity::getId))
				.map(this::toDto)
				.toList();
	}

	private GithubRepositoryDto toDto(GithubRepositoryEntity e) {
		return new GithubRepositoryDto(
				e.getId(),
				e.getGroupId(),
				e.getRepoUrl(),
				e.getRepoOwner(),
				e.getRepoName(),
				e.getDefaultBranch()
		);
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}

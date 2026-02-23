package com.swp391.repo;

import com.swp391.group.GroupMemberRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GithubRepositoryService {
	private final GithubRepositoryRepository repoRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	public List<GithubRepositoryEntity> listRepos(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
		return repoRepository.findByGroupId(groupId);
	}

	public GithubRepositoryEntity addRepo(Integer groupId, String repoUrl, UserPrincipal principal) {
		// Only requires membership; leader-only can be enforced later if needed.
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));

		URI uri = URI.create(repoUrl);
		String path = uri.getPath();
		String[] parts = path == null ? new String[0] : path.split("/");
		String owner = parts.length >= 2 ? parts[1] : null;
		String name = parts.length >= 3 ? parts[2].replaceAll("\\.git$", "") : null;

		GithubRepositoryEntity entity = new GithubRepositoryEntity();
		entity.setGroupId(groupId);
		entity.setRepoUrl(repoUrl);
		entity.setRepoOwner(owner);
		entity.setRepoName(name);
		entity.setIsActive(true);
		return repoRepository.save(entity);
	}
}

package com.swp391.integration.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.swp391.group.GroupMemberRepository;
import com.swp391.integration.github.dto.GithubStatsResponse;
import com.swp391.integration.GroupIntegrationService;
import com.swp391.repo.GithubRepositoryRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GithubService {
	private static final Logger log = LoggerFactory.getLogger(GithubService.class);

	private final GitHubClient gitHubClient;
	private final GithubActivityRepository activityRepository;
	private final GithubRepositoryRepository repoRepository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;
	private final GroupIntegrationService integrationService;

	public GithubStatsResponse stats(Integer groupId, Instant from, Instant to, UserPrincipal principal) {
		ensureMember(groupId, principal);
		LocalDateTime fromLdt = from == null ? null : LocalDateTime.ofInstant(from, ZoneOffset.UTC);
		LocalDateTime toLdt = to == null ? null : LocalDateTime.ofInstant(to, ZoneOffset.UTC);
		Map<String, Integer> map = new HashMap<>();
		for (Object[] row : activityRepository.sumCommitsByUser(groupId, fromLdt, toLdt)) {
			String username = (String) row[0];
			Integer sum = ((Number) row[1]).intValue();
			map.put(username == null ? "unknown" : username, sum);
		}
		return new GithubStatsResponse(groupId, map);
	}

	public int syncCommits(Integer groupId, UserPrincipal principal) {
		ensureMember(groupId, principal);
		String token = integrationService.resolveGithubToken(groupId);
		log.debug("syncCommits: groupId={}, tokenPresent={}", groupId, token != null && !token.isBlank());
		int inserted = 0;
		var repos = repoRepository.findByGroupId(groupId);
		for (var repo : repos) {
			if (repo.getIsActive() != null && !repo.getIsActive()) {
				continue;
			}
			if (repo.getRepoOwner() == null || repo.getRepoName() == null) {
				continue;
			}

			// Determine effective token: if the stored token returns 401, fall back to no-auth (public repos).
			String effectiveToken = token;

			String fallbackBranch = repo.getDefaultBranch() == null || repo.getDefaultBranch().isBlank()
					? "main"
					: repo.getDefaultBranch().trim();
			var branches = new java.util.LinkedHashSet<String>();
			try {
				JsonNode branchNodes = gitHubClient.listBranches(repo.getRepoOwner(), repo.getRepoName(), effectiveToken);
				if (branchNodes != null && branchNodes.isArray()) {
					for (JsonNode b : branchNodes) {
						String name = b.path("name").asText(null);
						if (name != null && !name.isBlank()) branches.add(name);
					}
				}
			} catch (RestClientResponseException ex) {
				if (ex.getStatusCode().value() == 401 && effectiveToken != null && !effectiveToken.isBlank()) {
					log.warn("GitHub token returned 401 for {}/{}. Retrying without token (public repo fallback).",
							repo.getRepoOwner(), repo.getRepoName());
					effectiveToken = null;
					try {
						JsonNode branchNodes = gitHubClient.listBranches(repo.getRepoOwner(), repo.getRepoName(), null);
						if (branchNodes != null && branchNodes.isArray()) {
							for (JsonNode b : branchNodes) {
								String name = b.path("name").asText(null);
								if (name != null && !name.isBlank()) branches.add(name);
							}
						}
					} catch (RestClientResponseException ex2) {
						log.warn("GitHub list branches also failed without token for {}/{} (status={})",
								repo.getRepoOwner(), repo.getRepoName(), ex2.getStatusCode().value());
					}
				} else {
					String body = null;
					try {
						body = ex.getResponseBodyAsString();
					} catch (Exception ignored) {
					}
					log.warn("GitHub list branches failed for {}/{} (status={}): {}",
							repo.getRepoOwner(), repo.getRepoName(), ex.getStatusCode().value(), body);
				}
			}
			if (branches.isEmpty()) {
				branches.add(fallbackBranch);
			}
			log.debug("syncCommits: repo {}/{} has {} branches", repo.getRepoOwner(), repo.getRepoName(), branches.size());

			final String tokenForCommits = effectiveToken;
			for (String branchName : branches) {
				JsonNode commits;
				try {
					commits = gitHubClient.listCommits(repo.getRepoOwner(), repo.getRepoName(), branchName, null, tokenForCommits);
					log.debug("syncCommits: branch '{}' returned {} commits",
							branchName, commits != null && commits.isArray() ? commits.size() : 0);
				} catch (RestClientResponseException ex) {
					if (ex.getStatusCode().value() == 401 && tokenForCommits != null && !tokenForCommits.isBlank()) {
						log.warn("GitHub token returned 401 for commits on {}/{}@{}. Retrying without token.",
								repo.getRepoOwner(), repo.getRepoName(), branchName);
						try {
							commits = gitHubClient.listCommits(repo.getRepoOwner(), repo.getRepoName(), branchName, null, null);
						} catch (RestClientResponseException ex2) {
							log.warn("GitHub list commits also failed without token for {}/{}@{} (status={})",
									repo.getRepoOwner(), repo.getRepoName(), branchName, ex2.getStatusCode().value());
							continue;
						}
					} else {
						String body = null;
						try {
							body = ex.getResponseBodyAsString();
						} catch (Exception ignored) {
						}
						log.warn("GitHub list commits failed for {}/{}@{} (status={}): {}",
								repo.getRepoOwner(), repo.getRepoName(), branchName, ex.getStatusCode().value(), body);
						continue;
					}
				}
				if (commits == null || !commits.isArray()) {
					continue;
				}
				for (JsonNode c : commits) {
					String sha = c.path("sha").asText(null);
					if (sha == null) continue;
					String message = c.path("commit").path("message").asText(null);
					String authorLogin = c.path("author").path("login").asText(null);
					String date = c.path("commit").path("author").path("date").asText(null);
					LocalDateTime occurredAt = null;
					try {
						if (date != null) occurredAt = LocalDateTime.ofInstant(Instant.parse(date), ZoneOffset.UTC);
					} catch (Exception ignored) {
					}

					GithubActivityEntity a = new GithubActivityEntity();
					a.setGroupId(groupId);
					a.setGithubUsername(authorLogin);
					a.setActivityType("commit");
					a.setCommitSha(sha);
					a.setCommitMessage(message);
					a.setRefName(branchName);
					a.setRepoName(repo.getRepoName());
					a.setPushedCommitCount(1);
					a.setOccurredAt(occurredAt);
					// Make event unique per branch so commits shared across branches still appear under each branch.
					a.setGithubEventId(branchName + ":" + sha);
					try {
						activityRepository.save(a);
						inserted++;
					} catch (DataIntegrityViolationException ignored) {
						// duplicate sha for group
					} catch (Exception ex) {
						log.error("syncCommits: UNEXPECTED save error for sha={} branch={}: {}", sha.substring(0, Math.min(8, sha.length())), branchName, ex.getMessage());
					}
				}
			}
		}
		log.info("syncCommits: groupId={} finished, inserted={}", groupId, inserted);
		return inserted;
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}
}

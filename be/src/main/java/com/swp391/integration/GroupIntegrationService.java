package com.swp391.integration;

import com.swp391.group.GroupMemberRepository;
import com.swp391.integration.dto.GroupIntegrationsResponse;
import com.swp391.integration.dto.UpdateGroupIntegrationsRequest;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupIntegrationService {
	private final GroupIntegrationRepository repository;
	private final StudentRepository studentRepository;
	private final GroupMemberRepository memberRepository;

	@Value("${jira.base-url:}")
	private String defaultJiraBaseUrl;

	@Value("${jira.email:}")
	private String defaultJiraEmail;

	@Value("${jira.api-token:}")
	private String defaultJiraApiToken;

	@Value("${github.token:}")
	private String defaultGithubToken;

	public record JiraConfig(String baseUrl, String email, String apiToken) {
	}

	public GroupIntegrationsResponse get(Integer groupId, UserPrincipal principal) {
		ensureMember(groupId, principal);
		var e = repository.findByGroupId(groupId).orElse(null);
		String jiraBaseUrl = (e != null && hasText(e.getJiraBaseUrl())) ? e.getJiraBaseUrl() : defaultJiraBaseUrl;
		String jiraEmail = (e != null && hasText(e.getJiraEmail())) ? e.getJiraEmail() : defaultJiraEmail;
		String jiraToken = (e != null && hasText(e.getJiraApiToken())) ? e.getJiraApiToken() : defaultJiraApiToken;
		String githubToken = (e != null && hasText(e.getGithubToken())) ? e.getGithubToken() : defaultGithubToken;
		return new GroupIntegrationsResponse(
				groupId,
				emptyToNull(jiraBaseUrl),
				emptyToNull(jiraEmail),
				hasText(jiraToken),
				hasText(githubToken)
		);
	}

	@Transactional
	public GroupIntegrationsResponse update(Integer groupId, UpdateGroupIntegrationsRequest request, UserPrincipal principal) {
		ensureMember(groupId, principal);
		ensureTeamLead(principal);

		GroupIntegrationEntity entity = repository.findByGroupId(groupId).orElseGet(() -> {
			GroupIntegrationEntity e = new GroupIntegrationEntity();
			e.setGroupId(groupId);
			return e;
		});

		if (request.jiraBaseUrl() != null) {
			entity.setJiraBaseUrl(emptyToNull(request.jiraBaseUrl()));
		}
		if (request.jiraEmail() != null) {
			entity.setJiraEmail(emptyToNull(request.jiraEmail()));
		}
		if (request.jiraApiToken() != null) {
			entity.setJiraApiToken(emptyToNull(request.jiraApiToken()));
		}
		if (request.githubToken() != null) {
			entity.setGithubToken(emptyToNull(request.githubToken()));
		}

		repository.save(entity);
		return get(groupId, principal);
	}

	public JiraConfig resolveJiraConfig(Integer groupId) {
		var e = repository.findByGroupId(groupId).orElse(null);
		String baseUrl = (e != null && hasText(e.getJiraBaseUrl())) ? e.getJiraBaseUrl() : defaultJiraBaseUrl;
		String email = (e != null && hasText(e.getJiraEmail())) ? e.getJiraEmail() : defaultJiraEmail;
		String token = (e != null && hasText(e.getJiraApiToken())) ? e.getJiraApiToken() : defaultJiraApiToken;
		return new JiraConfig(emptyToNull(baseUrl), emptyToNull(email), emptyToNull(token));
	}

	public String resolveGithubToken(Integer groupId) {
		var e = repository.findByGroupId(groupId).orElse(null);
		String token = (e != null && hasText(e.getGithubToken())) ? e.getGithubToken() : defaultGithubToken;
		return emptyToNull(token);
	}

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}

	private void ensureTeamLead(UserPrincipal principal) {
		String role = principal.getRole() == null ? "" : principal.getRole();
		if (!role.equalsIgnoreCase("TEAM_LEAD")) {
			throw new SecurityException("Only TEAM_LEAD can update integration settings");
		}
	}

	private static boolean hasText(String s) {
		return s != null && !s.isBlank();
	}

	private static String emptyToNull(String s) {
		return hasText(s) ? s.trim() : null;
	}


}

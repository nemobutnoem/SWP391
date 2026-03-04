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
	private final AdminIntegrationRepository adminRepository;
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
		String jiraBaseUrl = resolve(e != null ? e.getJiraBaseUrl() : null, "jira_base_url", defaultJiraBaseUrl);
		String jiraEmail = resolve(e != null ? e.getJiraEmail() : null, "jira_email", defaultJiraEmail);
		String jiraToken = resolve(e != null ? e.getJiraApiToken() : null, "jira_api_token", defaultJiraApiToken);
		String githubToken = resolve(e != null ? e.getGithubToken() : null, "github_token", defaultGithubToken);
		return new GroupIntegrationsResponse(
				groupId,
				emptyToNull(jiraBaseUrl),
				emptyToNull(jiraEmail),
				hasText(jiraToken),
				hasText(githubToken));
	}

	@Transactional
	public GroupIntegrationsResponse update(Integer groupId, UpdateGroupIntegrationsRequest request,
			UserPrincipal principal) {
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
		String baseUrl = resolve(e != null ? e.getJiraBaseUrl() : null, "jira_base_url", defaultJiraBaseUrl);
		String email = resolve(e != null ? e.getJiraEmail() : null, "jira_email", defaultJiraEmail);
		String token = resolve(e != null ? e.getJiraApiToken() : null, "jira_api_token", defaultJiraApiToken);
		return new JiraConfig(emptyToNull(baseUrl), emptyToNull(email), emptyToNull(token));
	}

	public String resolveGithubToken(Integer groupId) {
		var e = repository.findByGroupId(groupId).orElse(null);
		String token = resolve(e != null ? e.getGithubToken() : null, "github_token", defaultGithubToken);
		return emptyToNull(token);
	}

	// ─── resolution order: group config → admin DB config → application.properties
	// ─

	private String resolve(String groupValue, String adminKey, String propertyDefault) {
		if (hasText(groupValue))
			return groupValue;
		String adminValue = adminRepository.findByConfigKey(adminKey)
				.map(AdminIntegrationEntity::getConfigValue)
				.orElse(null);
		if (hasText(adminValue))
			return adminValue;
		return propertyDefault;
	}

	// ─── access checks ──────────────────────────────────────────────────

	private void ensureMember(Integer groupId, UserPrincipal principal) {
		String role = principal.getRole() == null ? "" : principal.getRole();
		// Admin and Lecturer can access any group's integrations
		if ("Admin".equalsIgnoreCase(role) || "Lecturer".equalsIgnoreCase(role)) {
			return;
		}
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
	}

	private void ensureTeamLead(UserPrincipal principal) {
		String role = principal.getRole() == null ? "" : principal.getRole();
		if (!role.equalsIgnoreCase("TEAM_LEAD") && !role.equalsIgnoreCase("Admin")) {
			throw new SecurityException("Only TEAM_LEAD or Admin can update integration settings");
		}
	}

	private static boolean hasText(String s) {
		return s != null && !s.isBlank();
	}

	private static String emptyToNull(String s) {
		return hasText(s) ? s.trim() : null;
	}
}

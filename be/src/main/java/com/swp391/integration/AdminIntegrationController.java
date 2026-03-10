package com.swp391.integration;

import com.swp391.common.ApiException;
import com.swp391.integration.dto.AdminIntegrationsResponse;
import com.swp391.integration.dto.UpdateAdminIntegrationsRequest;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private final AdminIntegrationRepository repository;

    @GetMapping
    public AdminIntegrationsResponse get(Authentication auth) {
        ensureAdmin((UserPrincipal) auth.getPrincipal());

        String jiraBaseUrl = getConfigValue("jira_base_url");
        String jiraEmail = getConfigValue("jira_email");
        String jiraApiToken = getConfigValue("jira_api_token");
        String githubToken = getConfigValue("github_token");

        return new AdminIntegrationsResponse(
                jiraBaseUrl,
                jiraEmail,
                hasText(jiraApiToken),
                hasText(githubToken));
    }

    @PutMapping
    @Transactional
    public AdminIntegrationsResponse update(@Valid @RequestBody UpdateAdminIntegrationsRequest request,
            Authentication auth) {
        ensureAdmin((UserPrincipal) auth.getPrincipal());

        if (request.jiraBaseUrl() != null) {
            setConfigValue("jira_base_url", emptyToNull(request.jiraBaseUrl()));
        }
        if (request.jiraEmail() != null) {
            setConfigValue("jira_email", emptyToNull(request.jiraEmail()));
        }
        if (request.jiraApiToken() != null) {
            setConfigValue("jira_api_token", emptyToNull(request.jiraApiToken()));
        }
        if (request.githubToken() != null) {
            setConfigValue("github_token", emptyToNull(request.githubToken()));
        }

        return get(auth);
    }

    // ─── helpers ────────────────────────────────────────────────────────

    private String getConfigValue(String key) {
        return repository.findByConfigKey(key)
                .map(AdminIntegrationEntity::getConfigValue)
                .orElse(null);
    }

    private void setConfigValue(String key, String value) {
        AdminIntegrationEntity entity = repository.findByConfigKey(key).orElseGet(() -> {
            AdminIntegrationEntity e = new AdminIntegrationEntity();
            e.setConfigKey(key);
            return e;
        });
        entity.setConfigValue(value);
        repository.save(entity);
    }

    private void ensureAdmin(UserPrincipal principal) {
        if (!"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw ApiException.forbidden("Only Admin can manage integration settings");
        }
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String emptyToNull(String s) {
        return hasText(s) ? s.trim() : null;
    }
}

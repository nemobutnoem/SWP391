package com.swp391.integration;

import com.swp391.integration.dto.GroupIntegrationsResponse;
import com.swp391.integration.dto.UpdateGroupIntegrationsRequest;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups/{groupId}/settings/integrations")
@RequiredArgsConstructor
public class GroupIntegrationController {
    private static final Logger log = LoggerFactory.getLogger(GroupIntegrationController.class);
    private final GroupIntegrationService service;

    @GetMapping
    public GroupIntegrationsResponse get(@PathVariable("groupId") Integer groupId, Authentication auth) {
        log.info("GET /groups/{}/settings/integrations", groupId);
        return service.get(groupId, (UserPrincipal) auth.getPrincipal());
    }

    @PutMapping
    public GroupIntegrationsResponse update(@PathVariable("groupId") Integer groupId,
                                            @RequestBody UpdateGroupIntegrationsRequest request,
                                            Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        log.info("PUT /groups/{}/settings/integrations — jiraBaseUrl={}, jiraEmail={}, jiraApiToken={}, githubToken={}",
                groupId,
                request.jiraBaseUrl() != null ? "provided" : "null",
                request.jiraEmail() != null ? "provided" : "null",
                request.jiraApiToken() != null ? "***" : "null",
                request.githubToken() != null ? "***" : "null");
        service.update(groupId, request, principal);
        return service.get(groupId, principal);
    }
}

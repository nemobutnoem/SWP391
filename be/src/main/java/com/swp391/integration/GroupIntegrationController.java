package com.swp391.integration;

import com.swp391.integration.dto.GroupIntegrationsResponse;
import com.swp391.integration.dto.UpdateGroupIntegrationsRequest;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups/{groupId}/settings/integrations")
@RequiredArgsConstructor
public class GroupIntegrationController {
	private final GroupIntegrationService service;

	@GetMapping
	public GroupIntegrationsResponse get(@PathVariable Integer groupId, Authentication auth) {
		return service.get(groupId, (UserPrincipal) auth.getPrincipal());
	}

	@PutMapping
	public GroupIntegrationsResponse update(
			@PathVariable Integer groupId,
			@Valid @RequestBody UpdateGroupIntegrationsRequest request,
			Authentication auth
	) {
		return service.update(groupId, request, (UserPrincipal) auth.getPrincipal());
	}
}

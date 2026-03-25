package com.swp391.integration.jira;

import com.swp391.integration.jira.dto.UpdateJiraStatusRequest;
import com.swp391.integration.jira.dto.SyncJiraIssuesRequest;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/jira")
@RequiredArgsConstructor
public class JiraController {
	private final JiraService jiraService;

	@GetMapping("/issues")
	public List<JiraIssueEntity> listIssues(@PathVariable("groupId") Integer groupId, Authentication auth) {
		return jiraService.listIssues(groupId, (UserPrincipal) auth.getPrincipal());
	}

	@PatchMapping("/issues/{issueKey}/status")
	public void pushStatus(
			@PathVariable("groupId") Integer groupId,
			@PathVariable("issueKey") String issueKey,
			@Valid @RequestBody UpdateJiraStatusRequest req,
			Authentication auth
	) {
		jiraService.pushStatus(groupId, issueKey, req.targetStatusName(), (UserPrincipal) auth.getPrincipal());
	}

	@PostMapping("/sync/issues")
	public int syncIssues(@PathVariable("groupId") Integer groupId, @Valid @RequestBody SyncJiraIssuesRequest req, Authentication auth) {
		return jiraService.syncIssues(groupId, req.projectKey(), (UserPrincipal) auth.getPrincipal());
	}
}


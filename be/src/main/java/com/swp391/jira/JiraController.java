package com.swp391.jira;

import com.swp391.jira.dto.UpdateJiraStatusRequest;
import com.swp391.jira.dto.SyncJiraIssuesRequest;
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
	public List<JiraIssueEntity> listIssues(@PathVariable Integer groupId, Authentication auth) {
		return jiraService.listIssues(groupId, (UserPrincipal) auth.getPrincipal());
	}

	@PatchMapping("/issues/{issueKey}/status")
	public void pushStatus(
			@PathVariable Integer groupId,
			@PathVariable String issueKey,
			@Valid @RequestBody UpdateJiraStatusRequest req,
			Authentication auth
	) {
		jiraService.pushStatus(groupId, issueKey, req.targetStatusName(), (UserPrincipal) auth.getPrincipal());
	}

	@PostMapping("/sync/issues")
	public int syncIssues(@PathVariable Integer groupId, @Valid @RequestBody SyncJiraIssuesRequest req, Authentication auth) {
		return jiraService.syncIssues(groupId, req.projectKey(), (UserPrincipal) auth.getPrincipal());
	}
}


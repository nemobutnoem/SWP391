package com.swp391.group;

import com.swp391.group.dto.GroupSummary;
import com.swp391.group.dto.SelectTopicRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GroupController {
	private final GroupService groupService;

	@GetMapping("/me/groups")
	public List<GroupSummary> myGroups(Authentication auth) {
		return groupService.myGroups(auth);
	}

	@PostMapping("/groups/{groupId}/topic")
	public void selectTopic(@PathVariable Integer groupId, @Valid @RequestBody SelectTopicRequest req, Authentication auth) {
		groupService.selectTopic(groupId, req.projectId(), auth);
	}
}

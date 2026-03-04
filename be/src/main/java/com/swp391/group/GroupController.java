package com.swp391.group;

import com.swp391.group.dto.*;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

	// Compatibility endpoint for the frontend, which calls GET /groups
	@GetMapping("/groups")
	public List<GroupSummary> listGroups(Authentication auth) {
		return groupService.myGroups(auth);
	}

	@PostMapping("/groups")
	@ResponseStatus(HttpStatus.CREATED)
	public GroupSummary createGroup(@Valid @RequestBody CreateGroupRequest request, Authentication auth) {
		return groupService.createGroup(request, (UserPrincipal) auth.getPrincipal());
	}

	@PutMapping("/groups/{groupId}")
	public GroupSummary updateGroup(@PathVariable Integer groupId, @Valid @RequestBody UpdateGroupRequest request,
			Authentication auth) {
		return groupService.updateGroup(groupId, request, (UserPrincipal) auth.getPrincipal());
	}

	@DeleteMapping("/groups/{groupId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteGroup(@PathVariable Integer groupId, Authentication auth) {
		groupService.deleteGroup(groupId, (UserPrincipal) auth.getPrincipal());
	}

	@PutMapping("/groups/{groupId}/lecturer")
	public GroupSummary assignLecturer(@PathVariable Integer groupId, @Valid @RequestBody AssignLecturerRequest request,
			Authentication auth) {
		return groupService.assignLecturer(groupId, request.lecturerId(), (UserPrincipal) auth.getPrincipal());
	}

	@PostMapping("/groups/{groupId}/topic")
	public void selectTopic(@PathVariable Integer groupId, @Valid @RequestBody SelectTopicRequest req,
			Authentication auth) {
		groupService.selectTopic(groupId, req.projectId(), auth);
	}
}

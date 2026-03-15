package com.swp391.group;

import com.swp391.common.ApiException;
import com.swp391.group.dto.GroupMemberDto;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GroupMemberController {
	private final GroupMemberService memberService;
	private final StudentRepository studentRepository;

	@GetMapping("/groups/{groupId}/members")
	public List<GroupMemberDto> listGroupMembers(@PathVariable Integer groupId, Authentication auth) {
		// Ensure caller is a member of the group.
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));

		// This check could also be in the service, but it's specific to the student role's view
		return memberService.listGroupMembers(groupId);
	}

	public record UpdateRoleRequest(@JsonProperty("role_in_group") String roleInGroup) {}

	@PutMapping("/group-members/{memberId}/role")
	public GroupMemberEntity updateRole(@PathVariable Integer memberId, @RequestBody UpdateRoleRequest req, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"LECTURER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only LECTURER or ADMIN can change member roles");
		}
		return memberService.updateRole(memberId, req.roleInGroup());
	}

	public record AddMemberRequest(
			@JsonProperty("student_id") Integer studentId,
			@JsonProperty("role_in_group") String roleInGroup
	) {}

	@PostMapping("/groups/{groupId}/members")
	@ResponseStatus(HttpStatus.CREATED)
	public GroupMemberEntity addMember(@PathVariable Integer groupId, @RequestBody AddMemberRequest req, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"LECTURER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only LECTURER or ADMIN can add members");
		}
		return memberService.addMember(groupId, req.studentId(), req.roleInGroup());
	}

	@DeleteMapping("/groups/{groupId}/members/{memberId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeMember(@PathVariable Integer groupId, @PathVariable Integer memberId, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"LECTURER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only LECTURER or ADMIN can remove members");
		}
		memberService.removeMember(groupId, memberId);
	}
}

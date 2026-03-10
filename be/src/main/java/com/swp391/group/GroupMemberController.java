package com.swp391.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.common.ApiException;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentEntity;
import com.swp391.student.StudentRepository;
import com.swp391.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GroupMemberController {
	private final GroupMemberRepository memberRepository;
	private final StudentRepository studentRepository;
	private final UserRepository userRepository;
	private final LecturerRepository lecturerRepository;

	public record GroupMemberDto(
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("student_id") Integer studentId,
			Integer userId,
			String fullName,
			String account,
			@JsonProperty("jira_account_id") String jiraAccountId,
			@JsonProperty("role_in_group") String roleInGroup
	) {
	}

	@GetMapping("/groups/{groupId}/members")
	public List<GroupMemberDto> listGroupMembers(@PathVariable Integer groupId, Authentication auth) {
		// Ensure caller is a member of the group.
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		var me = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		memberRepository.findByGroupIdAndStudentId(groupId, me.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));

		return memberRepository.findByGroupId(groupId).stream()
				.map(m -> {
					var student = studentRepository.findById(m.getStudentId()).orElse(null);
					Integer userId = student == null ? null : student.getUserId();
					var user = userId == null ? null : userRepository.findById(userId).orElse(null);
					return new GroupMemberDto(
							m.getGroupId(),
							m.getStudentId(),
							userId,
							student == null ? null : student.getFullName(),
							user == null ? null : user.getAccount(),
							user == null ? null : user.getJiraAccountId(),
							m.getRoleInGroup()
					);
				})
				.sorted(Comparator.comparing((GroupMemberDto d) -> d.fullName() == null ? "" : d.fullName()))
				.toList();
	}

	public record UpdateRoleRequest(@JsonProperty("role_in_group") String roleInGroup) {}

	@PutMapping("/group-members/{memberId}/role")
	public GroupMemberEntity updateRole(@PathVariable Integer memberId, @RequestBody UpdateRoleRequest req, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"Lecturer".equalsIgnoreCase(role) && !"Admin".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only Lecturer or Admin can change member roles");
		}
		GroupMemberEntity member = memberRepository.findById(memberId)
				.orElseThrow(() -> ApiException.notFound("Group member not found"));
		member.setRoleInGroup(req.roleInGroup());
		return memberRepository.save(member);
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
		if (!"Lecturer".equalsIgnoreCase(role) && !"Admin".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only Lecturer or Admin can add members");
		}
		// Validate student exists
		studentRepository.findById(req.studentId())
				.orElseThrow(() -> ApiException.notFound("Student not found with id: " + req.studentId()));

		GroupMemberEntity member = new GroupMemberEntity();
		member.setGroupId(groupId);
		member.setStudentId(req.studentId());
		member.setRoleInGroup(req.roleInGroup() != null ? req.roleInGroup() : "Member");
		member.setStatus("Active");
		member.setJoinedAt(java.time.LocalDateTime.now());
		try {
			return memberRepository.save(member);
		} catch (DataIntegrityViolationException ex) {
			throw ApiException.badRequest("Student is already a member of this group");
		}
	}

	@DeleteMapping("/groups/{groupId}/members/{memberId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeMember(@PathVariable Integer groupId, @PathVariable Integer memberId, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"Lecturer".equalsIgnoreCase(role) && !"Admin".equalsIgnoreCase(role)) {
			throw ApiException.forbidden("Only Lecturer or Admin can remove members");
		}
		GroupMemberEntity member = memberRepository.findById(memberId)
				.orElseThrow(() -> ApiException.notFound("Group member not found"));
		if (!member.getGroupId().equals(groupId)) {
			throw ApiException.badRequest("Member does not belong to this group");
		}
		memberRepository.delete(member);
	}
}

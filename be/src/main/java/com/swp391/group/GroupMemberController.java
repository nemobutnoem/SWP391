package com.swp391.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import com.swp391.user.UserEntity;
import com.swp391.user.UserRepository;
import lombok.RequiredArgsConstructor;
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

	public record GroupMemberDto(
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("student_id") Integer studentId,
			Integer userId,
			String fullName,
			String account,
			@JsonProperty("jira_account_id") String jiraAccountId,
			@JsonProperty("role_in_group") String roleInGroup) {
	}

	@GetMapping("/groups/{groupId}/members")
<<<<<<< Updated upstream
	public List<GroupMemberDto> listGroupMembers(@PathVariable Integer groupId, Authentication auth) {
=======
	public List<GroupMemberDto> listGroupMembers(@PathVariable("groupId") Integer groupId, Authentication auth) {
		// Ensure caller is a member of the group.
>>>>>>> Stashed changes
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (!isAdmin) {
			// Ensure caller is a member of the group.
			var me = studentRepository.findByUserId(principal.getUserId())
					.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
			memberRepository.findByGroupIdAndStudentId(groupId, me.getId())
					.orElseThrow(() -> new SecurityException("You are not a member of this group"));
		}

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
<<<<<<< Updated upstream
							user == null ? null : UserEntity.normalizeJiraAccountId(user.getJiraAccountId()),
							m.getRoleInGroup()
					);
=======
							user == null ? null : user.getJiraAccountId(),
							m.getRoleInGroup());
>>>>>>> Stashed changes
				})
				.sorted(Comparator.comparing((GroupMemberDto d) -> d.fullName() == null ? "" : d.fullName()))
				.toList();
	}
<<<<<<< Updated upstream
=======

	public record UpdateRoleRequest(@JsonProperty("role_in_group") String roleInGroup) {
	}

	@PutMapping("/group-members/{memberId}/role")
	public GroupMemberEntity updateRole(@PathVariable("memberId") Integer memberId, @RequestBody UpdateRoleRequest req,
			Authentication auth) {
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
>>>>>>> Stashed changes
}

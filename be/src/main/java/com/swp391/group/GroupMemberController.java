package com.swp391.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
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
}

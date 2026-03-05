package com.swp391.integration.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.clazz.ClassEntity;
import com.swp391.clazz.ClassRepository;
import com.swp391.group.GroupMemberEntity;
import com.swp391.group.GroupMemberRepository;
import com.swp391.group.StudentGroupEntity;
import com.swp391.group.StudentGroupRepository;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Compatibility endpoint for FE calls to GET /api/group-members.
 * Returns a flat list of all group members visible to the current user.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatGroupMemberController {
	private final GroupMemberRepository memberRepository;
	private final StudentGroupRepository groupRepository;
	private final StudentRepository studentRepository;
	private final LecturerRepository lecturerRepository;
	private final ClassRepository classRepository;

	public record GroupMemberFlatDto(
			Integer id,
			@JsonProperty("group_id") Integer groupId,
			@JsonProperty("student_id") Integer studentId,
			@JsonProperty("role_in_group") String roleInGroup,
			String status,
			@JsonProperty("joined_at") String joinedAt
	) {
	}

	@GetMapping("/group-members")
	public List<GroupMemberFlatDto> listAll(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();

		Set<Integer> groupIds;

		if ("Lecturer".equalsIgnoreCase(role) || "Admin".equalsIgnoreCase(role)) {
			groupIds = getLecturerOrAdminGroupIds(principal, role);
		} else {
			// Student: return members of groups the student belongs to
			var student = studentRepository.findByUserId(principal.getUserId()).orElse(null);
			if (student == null) return List.of();
			groupIds = memberRepository.findByStudentId(student.getId()).stream()
					.map(GroupMemberEntity::getGroupId)
					.collect(Collectors.toSet());
		}

		if (groupIds.isEmpty()) return List.of();

		return groupIds.stream()
				.flatMap(gid -> memberRepository.findByGroupId(gid).stream())
				.map(this::toDto)
				.toList();
	}

	private Set<Integer> getLecturerOrAdminGroupIds(UserPrincipal principal, String role) {
		if ("Admin".equalsIgnoreCase(role)) {
			// Admin sees all groups
			return groupRepository.findAll().stream()
					.map(StudentGroupEntity::getId)
					.collect(Collectors.toSet());
		}
		// Lecturer: find classes they teach, then groups in those classes
		var lecturer = lecturerRepository.findByUserId(principal.getUserId()).orElse(null);
		if (lecturer == null) return Set.of();
		var classes = classRepository.findByLecturerId(lecturer.getId());
		if (classes.isEmpty()) return Set.of();
		var classIds = classes.stream().map(ClassEntity::getId).collect(Collectors.toSet());
		return groupRepository.findByClassIdIn(classIds).stream()
				.map(StudentGroupEntity::getId)
				.collect(Collectors.toSet());
	}

	private GroupMemberFlatDto toDto(GroupMemberEntity m) {
		return new GroupMemberFlatDto(
				m.getId(),
				m.getGroupId(),
				m.getStudentId(),
				m.getRoleInGroup(),
				m.getStatus(),
				m.getJoinedAt() != null ? m.getJoinedAt().toString() : null
		);
	}
}

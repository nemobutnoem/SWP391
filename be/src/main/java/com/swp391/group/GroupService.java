package com.swp391.group;

import com.swp391.clazz.ClassEntity;
import com.swp391.clazz.ClassRepository;
import com.swp391.group.dto.GroupSummary;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.project.ProjectRepository;
import com.swp391.security.Role;
import com.swp391.security.UserPrincipal;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {
	private final StudentRepository studentRepository;
	private final StudentGroupRepository groupRepository;
	private final GroupMemberRepository memberRepository;
	private final ProjectRepository projectRepository;
	private final LecturerRepository lecturerRepository;
	private final ClassRepository classRepository;

	public List<GroupSummary> myGroups(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();

		// Lecturer: return groups in classes they teach
		if ("Lecturer".equalsIgnoreCase(role)) {
			return lecturerGroups(principal.getUserId());
		}

		// Admin: return all groups
		if ("Admin".equalsIgnoreCase(role)) {
			return groupRepository.findAll().stream()
					.map(this::toSummary)
					.toList();
		}

		// Student / Team Lead / Team Member
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		return memberRepository.findByStudentId(student.getId()).stream()
				.map(m -> groupRepository.findById(m.getGroupId()).orElse(null))
				.filter(g -> g != null)
				.map(this::toSummary)
				.toList();
	}

	private List<GroupSummary> lecturerGroups(Integer userId) {
		var lecturer = lecturerRepository.findByUserId(userId).orElse(null);
		if (lecturer == null) return List.of();
		var classes = classRepository.findByLecturerId(lecturer.getId());
		if (classes.isEmpty()) return List.of();
		var classIds = classes.stream().map(ClassEntity::getId).collect(Collectors.toSet());
		return groupRepository.findByClassIdIn(classIds).stream()
				.map(this::toSummary)
				.toList();
	}

	private GroupSummary toSummary(StudentGroupEntity g) {
		return new GroupSummary(g.getId(), g.getGroupCode(), g.getGroupName(),
				g.getSemesterId(), g.getClassId(), g.getProjectId(), g.getLeaderStudentId());
	}

	@Transactional
	public void selectTopic(Integer groupId, Integer projectId, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		if (!("ROLE_" + Role.TEAM_LEAD.name()).equals(principal.getAuthorities().iterator().next().getAuthority())) {
			throw new SecurityException("Only TEAM_LEAD can select topic");
		}
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		var group = groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("Group not found"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
		if (group.getLeaderStudentId() == null || !group.getLeaderStudentId().equals(student.getId())) {
			throw new SecurityException("Only group leader can select topic");
		}
		var project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalArgumentException("Project not found"));
		if (group.getSemesterId() != null && project.getSemesterId() != null && !group.getSemesterId().equals(project.getSemesterId())) {
			throw new IllegalArgumentException("Project is not in the same semester as group");
		}
		group.setProjectId(projectId);
		try {
			groupRepository.save(group);
		} catch (DataIntegrityViolationException ex) {
			// Likely unique constraint (class_id, project_id)
			throw new IllegalArgumentException("This topic is already chosen by another group in the same class");
		}
	}
}

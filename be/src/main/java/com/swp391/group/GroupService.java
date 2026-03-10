package com.swp391.group;

import com.swp391.clazz.ClassEntity;
import com.swp391.clazz.ClassRepository;
import com.swp391.common.ApiException;
import com.swp391.group.dto.*;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.project.ProjectRepository;
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

	// ─── READ ────────────────────────────────────────────────────────────

	public List<GroupSummary> myGroups(Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();

		// Lecturer: return groups in classes they teach
		if ("LECTURER".equalsIgnoreCase(role)) {
			return lecturerGroups(principal.getUserId());
		}

		// Admin: return all groups
		if ("ADMIN".equalsIgnoreCase(role)) {
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
		if (lecturer == null)
			return List.of();
		var classes = classRepository.findByLecturerId(lecturer.getId());
		if (classes.isEmpty())
			return List.of();
		var classIds = classes.stream().map(ClassEntity::getId).collect(Collectors.toSet());
		return groupRepository.findByClassIdIn(classIds).stream()
				.map(this::toSummary)
				.toList();
	}

	// ─── CREATE ──────────────────────────────────────────────────────────

	@Transactional
	public GroupSummary createGroup(CreateGroupRequest request, UserPrincipal principal) {
		ensureAdmin(principal);

		StudentGroupEntity entity = new StudentGroupEntity();
		entity.setSemesterId(request.semesterId());
		entity.setClassId(request.classId());
		entity.setGroupCode(request.groupCode());
		entity.setGroupName(request.groupName());
		entity.setDescription(request.description());
		entity.setStatus("Active");

		try {
			groupRepository.save(entity);
		} catch (DataIntegrityViolationException ex) {
			throw ApiException.badRequest("Group code already exists in this class/semester");
		}
		return toSummary(entity);
	}

	// ─── UPDATE ──────────────────────────────────────────────────────────

	@Transactional
	public GroupSummary updateGroup(Integer groupId, UpdateGroupRequest request, UserPrincipal principal) {
		ensureAdmin(principal);

		StudentGroupEntity entity = groupRepository.findById(groupId)
				.orElseThrow(() -> ApiException.notFound("Group not found with id: " + groupId));

		if (request.groupCode() != null) {
			entity.setGroupCode(request.groupCode());
		}
		if (request.groupName() != null) {
			entity.setGroupName(request.groupName());
		}
		if (request.description() != null) {
			entity.setDescription(request.description());
		}
		if (request.status() != null) {
			entity.setStatus(request.status());
		}

		try {
			groupRepository.save(entity);
		} catch (DataIntegrityViolationException ex) {
			throw ApiException.badRequest("Group code already exists in this class/semester");
		}
		return toSummary(entity);
	}

	// ─── DELETE ──────────────────────────────────────────────────────────

	@Transactional
	public void deleteGroup(Integer groupId, UserPrincipal principal) {
		ensureAdmin(principal);

		if (!groupRepository.existsById(groupId)) {
			throw ApiException.notFound("Group not found with id: " + groupId);
		}
		// Delete group members first
		memberRepository.deleteByGroupId(groupId);
		groupRepository.deleteById(groupId);
	}

	// ─── ASSIGN LECTURER ─────────────────────────────────────────────────

	@Transactional
	public GroupSummary assignLecturer(Integer groupId, Integer lecturerId, UserPrincipal principal) {
		ensureAdmin(principal);

		StudentGroupEntity entity = groupRepository.findById(groupId)
				.orElseThrow(() -> ApiException.notFound("Group not found with id: " + groupId));

		if (lecturerId != null) {
			lecturerRepository.findById(lecturerId)
					.orElseThrow(() -> ApiException.notFound("Lecturer not found with id: " + lecturerId));
		}

		entity.setLecturerId(lecturerId);
		groupRepository.save(entity);
		return toSummary(entity);
	}

	// ─── ASSIGN TOPIC ────────────────────────────────────────────────────

	@Transactional
	public GroupSummary assignTopic(Integer groupId, Integer projectId, UserPrincipal principal) {
		ensureLecturerOrAdmin(principal);

		StudentGroupEntity entity = groupRepository.findById(groupId)
				.orElseThrow(() -> ApiException.notFound("Group not found with id: " + groupId));

		if (projectId != null) {
			projectRepository.findById(projectId)
					.orElseThrow(() -> ApiException.notFound("Project not found with id: " + projectId));
		}

		entity.setProjectId(projectId);
		groupRepository.save(entity);
		return toSummary(entity);
	}

	// ─── SELECT TOPIC ────────────────────────────────────────────────────

	@Transactional
	public void selectTopic(Integer groupId, Integer projectId, Authentication auth) {
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		var student = studentRepository.findByUserId(principal.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("Student not found for current user"));
		var group = groupRepository.findById(groupId)
				.orElseThrow(() -> new IllegalArgumentException("Group not found"));
		memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
				.orElseThrow(() -> new SecurityException("You are not a member of this group"));
		if (group.getLeaderStudentId() == null || !group.getLeaderStudentId().equals(student.getId())) {
			throw new SecurityException("Only group leader can select topic");
		}
		var project = projectRepository.findById(projectId)
				.orElseThrow(() -> new IllegalArgumentException("Project not found"));
		if (group.getSemesterId() != null && project.getSemesterId() != null
				&& !group.getSemesterId().equals(project.getSemesterId())) {
			throw new IllegalArgumentException("Project is not in the same semester as group");
		}
		group.setProjectId(projectId);
		try {
			groupRepository.save(group);
		} catch (DataIntegrityViolationException ex) {
			throw new IllegalArgumentException("This topic is already chosen by another group in the same class");
		}
	}

	// ─── HELPERS ─────────────────────────────────────────────────────────

	private GroupSummary toSummary(StudentGroupEntity g) {
		return new GroupSummary(
				g.getId(), g.getGroupCode(), g.getGroupName(),
				g.getSemesterId(), g.getClassId(), g.getProjectId(),
				g.getLeaderStudentId(), g.getLecturerId(),
				g.getDescription(), g.getStatus());
	}

	private void ensureLecturerOrAdmin(UserPrincipal principal) {
		if (!"LECTURER".equalsIgnoreCase(principal.getRole()) && !"ADMIN".equalsIgnoreCase(principal.getRole())) {
			throw ApiException.forbidden("Only LECTURER or ADMIN can manage group topic allocation");
		}
	}

	private void ensureAdmin(UserPrincipal principal) {
		if (!"ADMIN".equalsIgnoreCase(principal.getRole())) {
			throw ApiException.forbidden("Only ADMIN can manage groups");
		}
	}
}

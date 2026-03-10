package com.swp391.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.clazz.ClassRepository;
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
	private final StudentRepository studentRepository;
	private final UserRepository userRepository;
	private final ClassRepository classRepository;

	public record StudentDto(
			Integer id,
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
			String major,
			@JsonProperty("github_username") String githubUsername,
			@JsonProperty("semester_id") Integer semesterId,
			String status) {
	}

	public record UpsertStudentRequest(
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") @NotBlank(message = "Full name is required") @jakarta.validation.constraints.Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters") String fullName,
			@JsonProperty("student_code") @NotBlank(message = "Student code is required") String studentCode,
			@NotBlank(message = "Email is required") @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z0-9._%+-]+@fpt\\.edu\\.vn$", message = "Only @fpt.edu.vn email is allowed") String email,
			String major,
			@JsonProperty("github_username") String githubUsername,
			String status) {
	}

	@GetMapping
	public List<StudentDto> list() {
		return studentRepository.findAll().stream().map(this::toDto).toList();
	}

	@GetMapping("/{studentId}")
	public StudentDto getById(@PathVariable Integer studentId) {
		return studentRepository.findById(studentId).map(this::toDto)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));
	}

	@PostMapping
	@org.springframework.transaction.annotation.Transactional
	public StudentDto create(@Valid @RequestBody UpsertStudentRequest req, org.springframework.security.core.Authentication auth) {
		ensureAdminOrLecturer(auth);
		try {
			String studentCode = emptyToNull(req.studentCode());
			String email = emptyToNull(req.email());

			com.swp391.user.UserEntity user = new com.swp391.user.UserEntity();
			user.setAccount(studentCode != null ? studentCode : email);
			user.setRole("TEAM_MEMBER");
			user.setGithubUsername(req.githubUsername());
			user.setStatus(req.status() != null ? req.status() : "Active");
			user = userRepository.save(user);

			StudentEntity s = new StudentEntity();
			s.setUserId(user.getId());
			s.setClassId(req.classId());
			s.setFullName(req.fullName());
			s.setStudentCode(studentCode);
			s.setEmail(email);
			s.setMajor(req.major());
			s.setStatus(req.status() != null ? req.status() : "Active");
			return toDto(studentRepository.save(s));
		} catch (org.springframework.dao.DataIntegrityViolationException ex) {
			String msg = ex.getMostSpecificCause().getMessage();
			if (msg.contains("uq_") || msg.contains("UNIQUE")) {
				throw com.swp391.common.ApiException.badRequest("Duplicate data: Email or Student Code already exists.");
			}
			throw com.swp391.common.ApiException.badRequest("Database Error: " + msg);
		}
	}

	@PutMapping("/{studentId}")
	@org.springframework.transaction.annotation.Transactional
	public StudentDto update(@PathVariable Integer studentId, @Valid @RequestBody UpsertStudentRequest req, org.springframework.security.core.Authentication auth) {
		ensureAdminOrLecturer(auth);
		StudentEntity s = studentRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		String studentCode = emptyToNull(req.studentCode());
		String email = emptyToNull(req.email());

		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(studentCode);
		s.setEmail(email);
		s.setMajor(req.major());
		s.setStatus(req.status());

		if (s.getUserId() != null) {
			userRepository.findById(s.getUserId()).ifPresent(user -> {
				user.setGithubUsername(req.githubUsername());
				if (studentCode != null) {
					user.setAccount(studentCode);
				} else if (email != null) {
					user.setAccount(email);
				}
				userRepository.save(user);
			});
		} else {
			com.swp391.user.UserEntity user = new com.swp391.user.UserEntity();
			user.setAccount(studentCode != null ? studentCode : email);
			user.setRole("TEAM_MEMBER");
			user.setGithubUsername(req.githubUsername());
			user.setStatus(req.status() != null ? req.status() : "Active");
			user = userRepository.save(user);
			s.setUserId(user.getId());
		}
		try {
			return toDto(studentRepository.save(s));
		} catch (org.springframework.dao.DataIntegrityViolationException ex) {
			String msg = ex.getMostSpecificCause().getMessage();
			if (msg.contains("uq_") || msg.contains("UNIQUE")) {
				throw com.swp391.common.ApiException.badRequest("Duplicate data error: Email or Code already exists in the system.");
			}
			throw com.swp391.common.ApiException.badRequest("Database Error: " + msg);
		}
	}

	private void ensureAdminOrLecturer(org.springframework.security.core.Authentication auth) {
		com.swp391.security.UserPrincipal principal = (com.swp391.security.UserPrincipal) auth.getPrincipal();
		String role = principal.getRole();
		if (!"ADMIN".equalsIgnoreCase(role) && !"LECTURER".equalsIgnoreCase(role)) {
			throw com.swp391.common.ApiException.forbidden("Only Admin or Lecturer can manage students");
		}
	}

	@DeleteMapping("/{studentId}")
	public void remove(@PathVariable Integer studentId) {
		studentRepository.deleteById(studentId);
	}

	private String emptyToNull(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	private StudentDto toDto(StudentEntity s) {
		String githubUsername = null;
		if (s.getUserId() != null) {
			githubUsername = userRepository.findById(s.getUserId())
					.map(u -> u.getGithubUsername())
					.orElse(null);
		}
		Integer semesterId = null;
		if (s.getClassId() != null) {
			semesterId = classRepository.findById(s.getClassId())
					.map(c -> c.getSemesterId())
					.orElse(null);
		}
		return new StudentDto(
				s.getId(),
				s.getUserId(),
				s.getClassId(),
				s.getFullName(),
				s.getStudentCode(),
				s.getEmail(),
				s.getMajor(),
				githubUsername,
				semesterId,
				s.getStatus());
	}
}

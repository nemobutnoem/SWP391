package com.swp391.student;

<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
import com.fasterxml.jackson.annotation.JsonProperty;
=======
import com.swp391.clazz.ClassRepository;
import com.swp391.student.dto.StudentResponseDto;
import com.swp391.student.dto.StudentUpsertRequest;
>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentManagementController {
	private final StudentRepository studentRepository;
	private final UserRepository userRepository;

<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
	public record StudentDto(
			Integer id,
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
			@JsonProperty("github_username") String githubUsername,
			String status) {
	}

	public record UpsertStudentRequest(
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") @NotBlank String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
			String status) {
	}

=======
>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
	@GetMapping
	public List<StudentResponseDto> list() {
		return studentRepository.findAll().stream().map(this::toDto).toList();
	}

	@GetMapping("/{studentId}")
	public ResponseEntity<StudentResponseDto> getById(@PathVariable("studentId") Integer studentId) {
		return studentRepository.findById(studentId).map(this::toDto)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PostMapping
<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
	@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
	public StudentDto create(@Valid @RequestBody UpsertStudentRequest req) {
=======
	public ResponseEntity<?> create(@Valid @RequestBody StudentUpsertRequest req) {
		// Kiểm tra trùng lặp
		if (studentRepository.existsByStudentCode(req.studentCode())) {
			return errorResponse("student_code", "Student code '" + req.studentCode() + "' is already registered.");
		}
		if (studentRepository.existsByEmail(req.email())) {
			return errorResponse("email", "Email '" + req.email() + "' is already registered.");
		}

		com.swp391.user.UserEntity user = new com.swp391.user.UserEntity();
		user.setAccount(req.studentCode());
		user.setRole("TEAM_MEMBER");
		user.setGithubUsername(req.githubUsername());
		user.setJiraAccountId(req.jiraAccountId());
		user.setStatus(req.status() != null ? req.status() : "Active");
		user = userRepository.save(user);

>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
		StudentEntity s = new StudentEntity();
		s.setUserId(req.userId());
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
		s.setStatus(req.status());
		return toDto(studentRepository.save(s));
	}

	@PutMapping("/{studentId}")
	@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
	public StudentDto update(@PathVariable Integer studentId, @Valid @RequestBody UpsertStudentRequest req) {
		StudentEntity s = studentRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));
		s.setUserId(req.userId());
=======
		s.setMajor(req.major());
		s.setStatus(req.status() != null ? req.status() : "Active");
		return ResponseEntity.status(HttpStatus.CREATED).body(toDto(studentRepository.save(s)));
	}

	@PutMapping("/{studentId}")
	public ResponseEntity<?> update(@PathVariable("studentId") Integer studentId,
			@Valid @RequestBody StudentUpsertRequest req) {
		StudentEntity s = studentRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		// Kiểm tra trùng lặp (trừ chính nó)
		if (studentRepository.existsByStudentCodeAndIdNot(req.studentCode(), studentId)) {
			return errorResponse("student_code",
					"Student code '" + req.studentCode() + "' is already used by another student.");
		}
		if (studentRepository.existsByEmailAndIdNot(req.email(), studentId)) {
			return errorResponse("email", "Email '" + req.email() + "' is already used by another student.");
		}

>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
		s.setStatus(req.status());
<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
		return toDto(studentRepository.save(s));
	}

	@DeleteMapping("/{studentId}")
	@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
	public void remove(@PathVariable Integer studentId) {
=======

		if (s.getUserId() != null) {
			userRepository.findById(s.getUserId()).ifPresent(user -> {
				user.setGithubUsername(req.githubUsername());
				user.setJiraAccountId(req.jiraAccountId());
				user.setAccount(req.studentCode());
				userRepository.save(user);
			});
		}
		return ResponseEntity.ok(toDto(studentRepository.save(s)));
	}

	private ResponseEntity<Map<String, String>> errorResponse(String field, String message) {
		Map<String, String> err = new java.util.LinkedHashMap<>();
		err.put(field, message);
		return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
	}

	@DeleteMapping("/{studentId}")
	public void remove(@PathVariable("studentId") Integer studentId) {
>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
		studentRepository.deleteById(studentId);
	}

	private StudentResponseDto toDto(StudentEntity s) {
		String githubUsername = null;
		if (s.getUserId() != null) {
			githubUsername = userRepository.findById(s.getUserId())
					.map(u -> u.getGithubUsername())
					.orElse(null);
		}
<<<<<<< Updated upstream:be/src/main/java/com/swp391/student/StudentController.java
		return new StudentDto(
=======
		Integer semesterId = null;
		if (s.getClassId() != null) {
			semesterId = classRepository.findById(s.getClassId())
					.map(c -> c.getSemesterId())
					.orElse(null);
		}
		return new StudentResponseDto(
>>>>>>> Stashed changes:be/src/main/java/com/swp391/student/StudentManagementController.java
				s.getId(),
				s.getUserId(),
				s.getClassId(),
				s.getFullName(),
				s.getStudentCode(),
				s.getEmail(),
				githubUsername,
				s.getStatus());
	}
}

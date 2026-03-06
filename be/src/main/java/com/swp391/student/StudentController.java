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
			@JsonProperty("full_name") @NotBlank String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
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
	public StudentDto create(@Valid @RequestBody UpsertStudentRequest req) {
		com.swp391.user.UserEntity user = new com.swp391.user.UserEntity();
		user.setAccount(req.studentCode() != null ? req.studentCode() : req.email());
		user.setRole("TEAM_MEMBER");
		user.setGithubUsername(req.githubUsername());
		user.setStatus(req.status() != null ? req.status() : "Active");
		user = userRepository.save(user);

		StudentEntity s = new StudentEntity();
		s.setUserId(user.getId());
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
		s.setMajor(req.major());
		s.setStatus(req.status() != null ? req.status() : "Active");
		return toDto(studentRepository.save(s));
	}

	@PutMapping("/{studentId}")
	public StudentDto update(@PathVariable Integer studentId, @Valid @RequestBody UpsertStudentRequest req) {
		StudentEntity s = studentRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
		s.setMajor(req.major());
		s.setStatus(req.status());

		if (s.getUserId() != null) {
			userRepository.findById(s.getUserId()).ifPresent(user -> {
				user.setGithubUsername(req.githubUsername());
				if (req.studentCode() != null)
					user.setAccount(req.studentCode());
				userRepository.save(user);
			});
		} else {
			com.swp391.user.UserEntity user = new com.swp391.user.UserEntity();
			user.setAccount(req.studentCode() != null ? req.studentCode() : req.email());
			user.setRole("TEAM_MEMBER");
			user.setGithubUsername(req.githubUsername());
			user.setStatus(req.status() != null ? req.status() : "Active");
			user = userRepository.save(user);
			s.setUserId(user.getId());
		}
		return toDto(studentRepository.save(s));
	}

	@DeleteMapping("/{studentId}")
	public void remove(@PathVariable Integer studentId) {
		studentRepository.deleteById(studentId);
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

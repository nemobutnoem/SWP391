package com.swp391.student;

import com.fasterxml.jackson.annotation.JsonProperty;
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

	public record StudentDto(
			Integer id,
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
			@JsonProperty("github_username") String githubUsername,
			String status
	) {
	}

	public record UpsertStudentRequest(
			@JsonProperty("user_id") Integer userId,
			@JsonProperty("class_id") Integer classId,
			@JsonProperty("full_name") @NotBlank String fullName,
			@JsonProperty("student_code") String studentCode,
			String email,
			String status
	) {
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
		StudentEntity s = new StudentEntity();
		s.setUserId(req.userId());
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
		s.setStatus(req.status());
		return toDto(studentRepository.save(s));
	}

	@PutMapping("/{studentId}")
	public StudentDto update(@PathVariable Integer studentId, @Valid @RequestBody UpsertStudentRequest req) {
		StudentEntity s = studentRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));
		s.setUserId(req.userId());
		s.setClassId(req.classId());
		s.setFullName(req.fullName());
		s.setStudentCode(req.studentCode());
		s.setEmail(req.email());
		s.setStatus(req.status());
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
		return new StudentDto(
				s.getId(),
				s.getUserId(),
				s.getClassId(),
				s.getFullName(),
				s.getStudentCode(),
				s.getEmail(),
				githubUsername,
				s.getStatus()
		);
	}
}

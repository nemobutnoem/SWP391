package com.swp391.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.clazz.ClassRepository;
import com.swp391.group.GroupMemberRepository;
import com.swp391.group.StudentGroupRepository;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.user.UserEntity;
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final LecturerRepository lecturerRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final StudentGroupRepository groupRepository;

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
            String email = emptyToNull(req.email());
            String studentCode = normalizeStudentCode(req.studentCode(), email);

            UserEntity user = resolveUserForStudentUpsert(req.userId(), studentCode, email, req.githubUsername(), req.status());

            StudentEntity s = new StudentEntity();
            s.setUserId(user.getId());
            s.setClassId(req.classId());
            s.setFullName(req.fullName());
            s.setStudentCode(studentCode);
            s.setEmail(email);
            s.setMajor(req.major());
            s.setStatus(req.status() != null ? req.status() : "Active");
            return toDto(studentRepository.saveAndFlush(s));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw handleConstraintViolation(ex);
        }
    }

    @PutMapping("/{studentId}")
    @org.springframework.transaction.annotation.Transactional
    public StudentDto update(@PathVariable Integer studentId, @Valid @RequestBody UpsertStudentRequest req, org.springframework.security.core.Authentication auth) {
        ensureAdminOrLecturer(auth);
        StudentEntity s = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        String email = emptyToNull(req.email());
        String studentCode = normalizeStudentCode(req.studentCode(), email);

        s.setClassId(req.classId());
        s.setFullName(req.fullName());
        s.setStudentCode(studentCode);
        s.setEmail(email);
        s.setMajor(req.major());
        s.setStatus(req.status());

        UserEntity user;
        if (s.getUserId() != null) {
            user = userRepository.findById(s.getUserId())
                    .orElseThrow(() -> com.swp391.common.ApiException.notFound("Linked user not found"));
            mergeReusableStudentIdentity(user, studentCode, email);
            user.setGithubUsername(req.githubUsername());
            user.setRole("TEAM_MEMBER");
            user.setStatus(req.status() != null ? req.status() : user.getStatus());
            userRepository.save(user);
        } else {
            user = resolveUserForStudentUpsert(req.userId(), studentCode, email, req.githubUsername(), req.status());
            s.setUserId(user.getId());
        }
        try {
            return toDto(studentRepository.saveAndFlush(s));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw handleConstraintViolation(ex);
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
    @org.springframework.transaction.annotation.Transactional
    public void remove(@PathVariable Integer studentId) {
        StudentEntity student = studentRepository.findById(studentId)
                .orElseThrow(() -> com.swp391.common.ApiException.notFound("Student not found"));
        Integer userId = student.getUserId();

        groupMemberRepository.findByStudentId(studentId).forEach(groupMemberRepository::delete);

        groupRepository.findAll().stream()
                .filter(group -> studentId.equals(group.getLeaderStudentId()))
                .forEach(group -> {
                    group.setLeaderStudentId(null);
                    groupRepository.save(group);
                });

        studentRepository.delete(student);
        cleanupOrphanUser(userId);
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private String normalizeStudentCode(String rawStudentCode, String email) {
        String raw = emptyToNull(rawStudentCode);
        if (raw == null && email != null && email.contains("@")) {
            raw = email.substring(0, email.indexOf("@")).trim();
        }
        if (raw == null || raw.isBlank()) return null;
        String normalized = raw.length() <= 8 ? raw : raw.substring(raw.length() - 8);
        return normalized.toUpperCase(Locale.ROOT);
    }

    private UserEntity resolveUserForStudentUpsert(Integer requestedUserId, String studentCode, String email, String githubUsername, String status) {
        UserEntity user;
        if (requestedUserId != null) {
            if (studentRepository.findByUserId(requestedUserId).isPresent()) {
                throw com.swp391.common.ApiException.badRequest("This account is already linked to a student profile.");
            }
            if (lecturerRepository.findByUserId(requestedUserId).isPresent()) {
                throw com.swp391.common.ApiException.badRequest("This account is already linked to a lecturer profile.");
            }
            user = userRepository.findById(requestedUserId)
                    .orElseThrow(() -> com.swp391.common.ApiException.notFound("User not found with id: " + requestedUserId));
        } else {
            user = findReusableUser(studentCode, email).orElseGet(() -> {
                UserEntity created = new UserEntity();
                created.setAccount(resolveNewUserAccount(studentCode, email));
                return created;
            });
        }

        user.setRole("TEAM_MEMBER");
        user.setGithubUsername(githubUsername);
        user.setStatus(status != null ? status : "Active");
        if (emptyToNull(user.getAccount()) == null) {
            user.setAccount(resolveNewUserAccount(studentCode, email));
        }
        return userRepository.save(user);
    }

    private java.util.Optional<UserEntity> findReusableUser(String studentCode, String email) {
        String emailLocal = extractEmailLocalPart(email);
        java.util.LinkedHashSet<Integer> candidateIds = new java.util.LinkedHashSet<>();

        if (studentCode != null) {
            userRepository.findByAccount(studentCode).map(UserEntity::getId).ifPresent(candidateIds::add);
        }
        if (emailLocal != null) {
            userRepository.findByAccount(emailLocal).map(UserEntity::getId).ifPresent(candidateIds::add);
        }
        if (email != null) {
            studentRepository.findByEmailIgnoreCase(email)
                    .map(StudentEntity::getUserId)
                    .ifPresent(candidateIds::add);
        }

        return candidateIds.stream()
                .map(id -> userRepository.findById(id).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(this::isReusableUser)
                .findFirst();
    }

    private boolean isReusableUser(UserEntity user) {
        Integer userId = user.getId();
        return studentRepository.findByUserId(userId).isEmpty() && lecturerRepository.findByUserId(userId).isEmpty();
    }

    private void mergeReusableStudentIdentity(UserEntity primaryUser, String studentCode, String email) {
        findReusableUser(studentCode, email)
                .filter(candidate -> !candidate.getId().equals(primaryUser.getId()))
                .ifPresent(candidate -> {
                    if (emptyToNull(primaryUser.getJiraAccountId()) == null) {
                        primaryUser.setJiraAccountId(candidate.getJiraAccountId());
                    }
                    if (emptyToNull(primaryUser.getGithubUsername()) == null) {
                        primaryUser.setGithubUsername(candidate.getGithubUsername());
                    }
                    if (emptyToNull(primaryUser.getAccount()) == null) {
                        primaryUser.setAccount(candidate.getAccount());
                    }
                    userRepository.save(primaryUser);
                    cleanupOrphanUser(candidate.getId());
                });
    }

    private void cleanupOrphanUser(Integer userId) {
        if (userId == null) return;
        if (studentRepository.findByUserId(userId).isPresent()) return;
        if (lecturerRepository.findByUserId(userId).isPresent()) return;
        userRepository.findById(userId).ifPresent(user -> {
            // Keep historical links (jira/issues/comments/activities) and mark user inactive.
            user.setStatus("Inactive");
            userRepository.save(user);
        });
    }

    private String extractEmailLocalPart(String email) {
        String normalized = emptyToNull(email);
        if (normalized == null || !normalized.contains("@")) return null;
        return normalized.substring(0, normalized.indexOf("@")).trim();
    }

    private String resolveNewUserAccount(String studentCode, String email) {
        String preferred = studentCode != null ? studentCode : extractEmailLocalPart(email);
        if (preferred == null || preferred.isBlank()) {
            throw com.swp391.common.ApiException.badRequest("Student account could not be generated.");
        }
        return preferred;
    }

    private com.swp391.common.ApiException handleConstraintViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause() == null ? ex.getMessage() : ex.getMostSpecificCause().getMessage();
        if (msg != null && (msg.contains("UX_users_account") || msg.contains("uq_") || msg.contains("UNIQUE"))) {
            return com.swp391.common.ApiException.badRequest("Account or student information already exists in the system.");
        }
        return com.swp391.common.ApiException.badRequest("Database Error: " + msg);
    }

    private StudentDto toDto(StudentEntity s) {
        String githubUsername = null;
        if (s.getUserId() != null) {
            githubUsername = userRepository.findById(s.getUserId())
                    .map(UserEntity::getGithubUsername)
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

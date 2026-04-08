package com.swp391.clazz;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.common.ApiException;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes/{classId}/enrollments")
@RequiredArgsConstructor
public class ClassEnrollmentController {

    private final ClassEnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
        private final ClassService classService;

    public record EnrollRequest(
            @JsonProperty("student_id") Integer studentId
    ) {}

    public record EnrollmentDto(
            Integer id,
            @JsonProperty("student_id") Integer studentId,
            @JsonProperty("class_id") Integer classId,
            String status,
            @JsonProperty("student_name") String studentName,
            @JsonProperty("student_code") String studentCode
    ) {}

    @GetMapping
    public List<EnrollmentDto> list(@PathVariable("classId") Integer classId) {
        return enrollmentRepository.findByClassId(classId).stream()
                .map(e -> {
                    var student = studentRepository.findById(e.getStudentId()).orElse(null);
                    return new EnrollmentDto(
                            e.getId(), e.getStudentId(), e.getClassId(), e.getStatus(),
                            student != null ? student.getFullName() : null,
                            student != null ? student.getStudentCode() : null
                    );
                }).toList();
    }

    /**
     * Pre-enroll a student into a class (typically a CAPSTONE/3w class).
     * The class can be Inactive — this is just "xếp lớp".
         * Allowed when semester is UPCOMING, or when semester is ACTIVE but capstone has not started yet.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassEnrollmentEntity enroll(@PathVariable("classId") Integer classId,
                                         @RequestBody EnrollRequest req) {
                // Apply semester/phase rules for CAPSTONE enrollment
                classService.ensureCanEnrollCapstone(classId);

        var student = studentRepository.findById(req.studentId())
                .orElseThrow(() -> ApiException.notFound("Student not found"));

        if (enrollmentRepository.existsByStudentIdAndClassId(req.studentId(), classId)) {
            throw ApiException.badRequest("Student '" + student.getFullName() + "' is already enrolled in this class.");
        }

        var cls = classRepository.findById(classId)
                .orElseThrow(() -> ApiException.notFound("Class not found"));

        // Determine status: if class is Active → ACTIVE, otherwise → PRE_ENROLLED
        String status = "Active".equalsIgnoreCase(cls.getStatus()) ? "ACTIVE" : "PRE_ENROLLED";

        ClassEnrollmentEntity enrollment = new ClassEnrollmentEntity();
        enrollment.setStudentId(req.studentId());
        enrollment.setClassId(classId);
        enrollment.setStatus(status);
        return enrollmentRepository.save(enrollment);
    }

    @DeleteMapping("/{enrollmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unenroll(@PathVariable("classId") Integer classId,
                          @PathVariable("enrollmentId") Integer enrollmentId) {
        var enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> ApiException.notFound("Enrollment not found"));
        if (!enrollment.getClassId().equals(classId)) {
            throw ApiException.badRequest("Enrollment does not belong to this class.");
        }
        enrollmentRepository.delete(enrollment);
    }
}

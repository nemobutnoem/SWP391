package com.swp391.grade;

import com.swp391.common.ApiException;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {
    private final GradeRepository gradeRepository;
    private final LecturerRepository lecturerRepository;

    @GetMapping
    public List<GradeEntity> list(
            @RequestParam(required = false) Integer groupId,
            @RequestParam(required = false) Integer lecturerId,
            Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        String role = principal.getRole();

        if (groupId != null) {
            return gradeRepository.findByGroupId(groupId);
        }
        if (lecturerId != null) {
            return gradeRepository.findByLecturerId(lecturerId);
        }

        // Lecturer: only own grades
        if ("Lecturer".equalsIgnoreCase(role)) {
            var lecturer = lecturerRepository.findByUserId(principal.getUserId()).orElse(null);
            if (lecturer == null)
                return List.of();
            return gradeRepository.findByLecturerId(lecturer.getId());
        }

        // Admin: all
        return gradeRepository.findAll();
    }

    public record UpdateGradeRequest(
            BigDecimal score,
            String feedback,
            String status,
            String milestone,
            String date) {
    }

    @PostMapping
    public GradeEntity create(@RequestBody CreateGradeRequest req, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        ensureLecturerOrAdmin(principal);

        GradeEntity entity = new GradeEntity();
        entity.setGroupId(req.groupId);
        entity.setMilestone(req.milestone);
        entity.setStatus("PENDING");

        if ("Lecturer".equalsIgnoreCase(principal.getRole())) {
            var lecturer = lecturerRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> ApiException.notFound("Lecturer not found"));
            entity.setLecturerId(lecturer.getId());
        } else {
            entity.setLecturerId(req.lecturerId);
        }

        if (req.date != null && !req.date.isBlank()) {
            entity.setDate(java.time.LocalDate.parse(req.date));
        }

        return gradeRepository.save(entity);
    }

    public record CreateGradeRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("group_id") Integer groupId,
            @com.fasterxml.jackson.annotation.JsonProperty("lecturer_id") Integer lecturerId,
            String milestone,
            String date) {
    }

    @PutMapping("/{gradeId}")
    public GradeEntity update(@PathVariable Integer gradeId, @RequestBody UpdateGradeRequest req, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        ensureLecturerOrAdmin(principal);

        GradeEntity entity = gradeRepository.findById(gradeId)
                .orElseThrow(() -> ApiException.notFound("Grade not found with id: " + gradeId));

        // Lecturer can only update own grades
        if ("Lecturer".equalsIgnoreCase(principal.getRole())) {
            var lecturer = lecturerRepository.findByUserId(principal.getUserId()).orElse(null);
            if (lecturer == null || !lecturer.getId().equals(entity.getLecturerId())) {
                throw ApiException.forbidden("You can only update your own grades");
            }
        }

        if (req.score() != null) {
            entity.setScore(req.score());
        }
        if (req.feedback() != null) {
            entity.setFeedback(req.feedback());
        }
        if (req.status() != null) {
            entity.setStatus(req.status());
        }
        if (req.milestone() != null) {
            entity.setMilestone(req.milestone());
        }
        if (req.date() != null) {
            entity.setDate(req.date().isBlank() ? null : java.time.LocalDate.parse(req.date()));
        }

        return gradeRepository.save(entity);
    }

    private void ensureLecturerOrAdmin(UserPrincipal principal) {
        String role = principal.getRole();
        if (!"Lecturer".equalsIgnoreCase(role) && !"Admin".equalsIgnoreCase(role)) {
            throw ApiException.forbidden("Only Lecturer or Admin can manage grades");
        }
    }
}

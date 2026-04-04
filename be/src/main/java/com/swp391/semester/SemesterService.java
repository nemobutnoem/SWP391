package com.swp391.semester;

import com.swp391.clazz.ClassRepository;
import com.swp391.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SemesterService {
    private final SemesterRepository semesterRepository;
    private final ClassRepository classRepository;

    private static final Set<String> VALID_STATUSES = Set.of("Active", "Upcoming", "Completed");

    // Allowed transitions: Upcoming -> Active -> Completed
    private static final java.util.Map<String, Set<String>> ALLOWED_TRANSITIONS = java.util.Map.of(
            "Upcoming", Set.of("Active", "Upcoming"),
            "Active", Set.of("Completed", "Active"),
            "Completed", Set.of("Completed")
    );

    public List<SemesterEntity> listAll() {
        return semesterRepository.findAll();
    }

    public SemesterEntity getActiveSemester() {
        return semesterRepository.findByStatusIgnoreCase("active")
                .orElseThrow(() -> ApiException.notFound("No active semester found"));
    }

    public SemesterEntity getById(Integer id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Semester not found with id: " + id));
    }

    public SemesterEntity create(SemesterController.UpsertSemesterRequest req) {
        validateSemester(req, null);

        SemesterEntity entity = new SemesterEntity();
        entity.setCode(req.code());
        entity.setName(req.name());
        entity.setStartDate(req.startDate());
        entity.setEndDate(req.endDate());
        // New semesters default to Upcoming so admin can set up classes first
        entity.setStatus(req.status() != null ? req.status() : "Upcoming");
        return semesterRepository.save(entity);
    }

    public SemesterEntity update(Integer id, SemesterController.UpsertSemesterRequest req) {
        SemesterEntity entity = getById(id);
        validateSemester(req, id);

        // Enforce lifecycle transitions
        String currentStatus = entity.getStatus() != null ? entity.getStatus() : "Upcoming";
        String newStatus = req.status() != null ? req.status() : currentStatus;
        Set<String> allowed = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(newStatus)) {
            throw ApiException.badRequest(
                    "Cannot change semester status from '" + currentStatus + "' to '" + newStatus
                            + "'. Allowed transitions: " + currentStatus + " → " + String.join(", ", allowed) + ".");
        }

        entity.setCode(req.code());
        entity.setName(req.name());
        entity.setStartDate(req.startDate());
        entity.setEndDate(req.endDate());
        entity.setStatus(newStatus);
        SemesterEntity saved = semesterRepository.save(entity);

        // Auto-activate MAIN classes when semester transitions Upcoming → Active
        if ("Upcoming".equalsIgnoreCase(currentStatus) && "Active".equalsIgnoreCase(newStatus)) {
            var classes = classRepository.findBySemesterId(id);
            for (var cls : classes) {
                if ("MAIN".equalsIgnoreCase(cls.getClassType()) && "Inactive".equalsIgnoreCase(cls.getStatus())) {
                    cls.setStatus("Active");
                    classRepository.save(cls);
                }
            }
        }

        return saved;
    }

    public void delete(Integer id) {
        if (!semesterRepository.existsById(id)) {
            throw ApiException.notFound("Semester not found with id: " + id);
        }
        if (!classRepository.findBySemesterId(id).isEmpty()) {
            throw ApiException.badRequest("Cannot delete semester: it still has classes assigned. Remove all classes first.");
        }
        semesterRepository.deleteById(id);
    }

    private void validateSemester(SemesterController.UpsertSemesterRequest req, Integer existingId) {
        // Validate dates are required
        if (req.startDate() == null) {
            throw ApiException.badRequest("Start date is required.");
        }
        if (req.endDate() == null) {
            throw ApiException.badRequest("End date is required.");
        }

        // Validate end date > start date
        if (!req.endDate().isAfter(req.startDate())) {
            throw ApiException.badRequest("End date must be after start date.");
        }

        // Validate start date not in the past for new semesters
        if (existingId == null && req.startDate().isBefore(java.time.LocalDate.now())) {
            throw ApiException.badRequest("Start date cannot be in the past for a new semester.");
        }

        // Validate unique code
        if (existingId == null) {
            if (semesterRepository.existsByCode(req.code())) {
                throw ApiException.badRequest("Semester code '" + req.code() + "' already exists. Please use a different code.");
            }
        } else {
            if (semesterRepository.existsByCodeAndIdNot(req.code(), existingId)) {
                throw ApiException.badRequest("Semester code '" + req.code() + "' already exists. Please use a different code.");
            }
        }

        // Validate status value
        String status = req.status() != null ? req.status() : "Upcoming";
        if (!VALID_STATUSES.contains(status)) {
            throw ApiException.badRequest("Invalid status '" + status + "'. Allowed values: Active, Upcoming, Completed.");
        }

        // Validate only one Active semester at a time
        if ("Active".equalsIgnoreCase(status)) {
            if (existingId != null) {
                List<SemesterEntity> otherActives = semesterRepository.findByStatusIgnoreCaseAndIdNot("Active", existingId);
                if (!otherActives.isEmpty()) {
                    throw ApiException.badRequest("There is already an active semester ('" + otherActives.get(0).getCode()
                            + "'). Please complete it before activating a new one.");
                }
            } else {
                semesterRepository.findByStatusIgnoreCase("Active").ifPresent(existing -> {
                    throw ApiException.badRequest("There is already an active semester ('" + existing.getCode()
                            + "'). Please complete it before activating a new one.");
                });
            }
        }

        // Validate date overlap with other semesters
        List<SemesterEntity> allSemesters = semesterRepository.findAll();
        for (SemesterEntity other : allSemesters) {
            if (existingId != null && other.getId().equals(existingId)) continue;
            if (other.getStartDate() != null && other.getEndDate() != null) {
                boolean overlaps = !req.endDate().isBefore(other.getStartDate())
                        && !req.startDate().isAfter(other.getEndDate());
                if (overlaps) {
                    throw ApiException.badRequest(
                            "Semester dates overlap with existing semester '" + other.getCode()
                                    + "' (" + other.getStartDate() + " to " + other.getEndDate() + ").");
                }
            }
        }
    }
}

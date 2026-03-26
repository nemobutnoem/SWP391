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
        entity.setStatus(req.status() != null ? req.status() : "Active");
        return semesterRepository.save(entity);
    }

    public SemesterEntity update(Integer id, SemesterController.UpsertSemesterRequest req) {
        SemesterEntity entity = getById(id);
        validateSemester(req, id);

        entity.setCode(req.code());
        entity.setName(req.name());
        entity.setStartDate(req.startDate());
        entity.setEndDate(req.endDate());
        if (req.status() != null) entity.setStatus(req.status());
        return semesterRepository.save(entity);
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

        // Validate unique code
        if (existingId == null) {
            // Create
            if (semesterRepository.existsByCode(req.code())) {
                throw ApiException.badRequest("Semester code '" + req.code() + "' already exists. Please use a different code.");
            }
        } else {
            // Update
            if (semesterRepository.existsByCodeAndIdNot(req.code(), existingId)) {
                throw ApiException.badRequest("Semester code '" + req.code() + "' already exists. Please use a different code.");
            }
        }

        // Validate status value
        String status = req.status() != null ? req.status() : "Active";
        if (!VALID_STATUSES.contains(status)) {
            throw ApiException.badRequest("Invalid status '" + status + "'. Allowed values: Active, Upcoming, Completed.");
        }

        // Validate only one Active semester at a time
        if ("Active".equalsIgnoreCase(status)) {
            if (existingId != null) {
                List<SemesterEntity> otherActives = semesterRepository.findByStatusIgnoreCaseAndIdNot("Active", existingId);
                if (!otherActives.isEmpty()) {
                    throw ApiException.badRequest("There is already an active semester ('" + otherActives.get(0).getCode()
                            + "'). Please set it to Completed or Upcoming before activating a new one.");
                }
            } else {
                semesterRepository.findByStatusIgnoreCase("Active").ifPresent(existing -> {
                    throw ApiException.badRequest("There is already an active semester ('" + existing.getCode()
                            + "'). Please set it to Completed or Upcoming before activating a new one.");
                });
            }
        }
    }
}

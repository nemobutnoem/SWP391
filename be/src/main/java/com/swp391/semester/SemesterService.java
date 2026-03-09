package com.swp391.semester;

import com.swp391.clazz.ClassRepository;
import com.swp391.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {
    private final SemesterRepository semesterRepository;
    private final ClassRepository classRepository;

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
}

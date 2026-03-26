package com.swp391.clazz;

import com.swp391.common.ApiException;
import com.swp391.group.StudentGroupRepository;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.semester.SemesterRepository;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClassService {
    private final ClassRepository classRepository;
    private final StudentGroupRepository groupRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final LecturerRepository lecturerRepository;

    private static final Set<String> VALID_STATUSES = Set.of("Active", "Inactive");

    public List<ClassEntity> listAll() {
        return classRepository.findAll();
    }

    public List<ClassEntity> findBySemester(Integer semesterId) {
        return classRepository.findBySemesterId(semesterId);
    }

    public ClassEntity getById(Integer id) {
        return classRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Class not found with id: " + id));
    }

    public ClassEntity create(ClassController.UpsertClassRequest req) {
        validateClass(req, null);

        ClassEntity entity = new ClassEntity();
        entity.setClassCode(req.classCode());
        entity.setClassName(req.className());
        entity.setSemesterId(req.semesterId());
        entity.setMajor(req.major());
        entity.setIntakeYear(req.intakeYear());
        entity.setDepartment(req.department());
        entity.setLecturerId(req.lecturerId());
        entity.setStatus(req.status() != null ? req.status() : "Active");
        return classRepository.save(entity);
    }

    @Transactional
    public ClassEntity update(Integer id, ClassController.UpsertClassRequest req) {
        ClassEntity entity = getById(id);
        validateClass(req, id);

        entity.setClassCode(req.classCode());
        entity.setClassName(req.className());
        entity.setSemesterId(req.semesterId());
        entity.setMajor(req.major());
        entity.setIntakeYear(req.intakeYear());
        entity.setDepartment(req.department());
        entity.setLecturerId(req.lecturerId());
        if (req.status() != null) entity.setStatus(req.status());
        ClassEntity saved = classRepository.save(entity);

        // Sync lecturer_id to all groups in this class
        var groups = groupRepository.findByClassId(id);
        for (var group : groups) {
            group.setLecturerId(req.lecturerId());
            groupRepository.save(group);
        }

        return saved;
    }

    public void delete(Integer id) {
        if (!classRepository.existsById(id)) {
            throw ApiException.notFound("Class not found with id: " + id);
        }
        if (!groupRepository.findByClassId(id).isEmpty()) {
            throw ApiException.badRequest("Cannot delete class: it still has groups assigned. Remove all groups first.");
        }
        if (studentRepository.countByClassId(id) > 0) {
            throw ApiException.badRequest("Cannot delete class: it still has students enrolled. Reassign students first.");
        }
        classRepository.deleteById(id);
    }

    private void validateClass(ClassController.UpsertClassRequest req, Integer existingId) {
        // Validate class code uniqueness
        if (existingId == null) {
            if (classRepository.existsByClassCode(req.classCode())) {
                throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists. Please use a different code.");
            }
        } else {
            ClassEntity existing = getById(existingId);
            if (!existing.getClassCode().equals(req.classCode()) && classRepository.existsByClassCode(req.classCode())) {
                throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists.");
            }
        }

        // Validate semester exists
        if (req.semesterId() == null) {
            throw ApiException.badRequest("Semester is required.");
        }
        if (!semesterRepository.existsById(req.semesterId())) {
            throw ApiException.badRequest("Semester not found with id: " + req.semesterId());
        }

        // Validate class name required
        if (req.className() == null || req.className().isBlank()) {
            throw ApiException.badRequest("Class name is required.");
        }

        // Validate intake year
        if (req.intakeYear() != null) {
            int currentYear = LocalDate.now().getYear();
            if (req.intakeYear() < 2000 || req.intakeYear() > currentYear + 1) {
                throw ApiException.badRequest("Intake year must be between 2000 and " + (currentYear + 1) + ".");
            }
        }

        // Validate status
        String status = req.status() != null ? req.status() : "Active";
        if (!VALID_STATUSES.contains(status)) {
            throw ApiException.badRequest("Invalid status '" + status + "'. Allowed values: Active, Inactive.");
        }

        // Validate lecturer exists if provided
        if (req.lecturerId() != null && !lecturerRepository.existsById(req.lecturerId())) {
            throw ApiException.badRequest("Lecturer not found with id: " + req.lecturerId());
        }
    }
}

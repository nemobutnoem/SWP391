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
    private final ClassEnrollmentRepository enrollmentRepository;
    private final StudentGroupRepository groupRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final LecturerRepository lecturerRepository;

    private static final Set<String> VALID_STATUSES = Set.of("Active", "Inactive", "Completed");
    private static final Set<String> VALID_CLASS_TYPES = Set.of("MAIN", "CAPSTONE");

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
        entity.setClassType(req.classType() != null ? req.classType() : "MAIN");
        entity.setPrerequisiteClassId(req.prerequisiteClassId());
        entity.setStartDate(req.startDate());
        entity.setEndDate(req.endDate());
        // New classes in non-active semesters default to Inactive
        String status = req.status() != null ? req.status() : "Active";
        var semester = semesterRepository.findById(req.semesterId()).orElse(null);
        if (semester != null && !"Active".equalsIgnoreCase(semester.getStatus())) {
            status = "Inactive";
        }
        entity.setStatus(status);
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
        if (req.classType() != null) entity.setClassType(req.classType());
        entity.setPrerequisiteClassId(req.prerequisiteClassId());
        entity.setStartDate(req.startDate());
        entity.setEndDate(req.endDate());
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

    /**
     * Check if the semester of a given class is currently Active.
     * Used by StudentController and GroupService to block operations on non-active semesters.
     */
    public void ensureSemesterActive(Integer classId) {
        ClassEntity cls = getById(classId);
        var semester = semesterRepository.findById(cls.getSemesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found for class"));
        if (!"Active".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest(
                    "Semester '" + semester.getName() + "' is not active (status: " + semester.getStatus()
                            + "). You can only add students/groups when the semester is Active.");
        }
    }

    /**
     * For CAPSTONE classes: ensure the prerequisite MAIN class is Completed.
     */
    public void ensurePrerequisiteCompleted(Integer classId) {
        ClassEntity cls = getById(classId);
        if (!"CAPSTONE".equalsIgnoreCase(cls.getClassType())) return;
        if (cls.getPrerequisiteClassId() == null) return;

        ClassEntity prereq = classRepository.findById(cls.getPrerequisiteClassId()).orElse(null);
        if (prereq == null) return;
        if (!"Completed".equalsIgnoreCase(prereq.getStatus())) {
            throw ApiException.badRequest(
                    "Cannot activate capstone class: prerequisite class '" + prereq.getClassCode()
                            + "' has not completed yet (status: " + prereq.getStatus() + ").");
        }
    }

    private void validateClass(ClassController.UpsertClassRequest req, Integer existingId) {
        // Validate class code uniqueness
        if (existingId == null) {
            if (classRepository.existsByClassCode(req.classCode())) {
                throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists. Please use a different code.");
            }
        } else {
            if (classRepository.existsByClassCodeAndIdNot(req.classCode(), existingId)) {
                throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists.");
            }
        }

        // Validate semester exists
        if (req.semesterId() == null) {
            throw ApiException.badRequest("Semester is required.");
        }
        var semester = semesterRepository.findById(req.semesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found with id: " + req.semesterId()));

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
            throw ApiException.badRequest("Invalid status '" + status + "'. Allowed values: Active, Inactive, Completed.");
        }

        // Block activating class if semester is not active
        if ("Active".equalsIgnoreCase(status) && !"Active".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest(
                    "Cannot set class to Active: semester '" + semester.getName() + "' is not active. Activate the semester first.");
        }

        // Validate class type
        String classType = req.classType() != null ? req.classType() : "MAIN";
        if (!VALID_CLASS_TYPES.contains(classType)) {
            throw ApiException.badRequest("Invalid class type '" + classType + "'. Allowed values: MAIN, CAPSTONE.");
        }

        // Upcoming semesters can only have MAIN (10w) classes
        if ("Upcoming".equalsIgnoreCase(semester.getStatus()) && "CAPSTONE".equalsIgnoreCase(classType)) {
            throw ApiException.badRequest(
                    "Cannot create Capstone (3w) class in an Upcoming semester. Activate the semester and complete the Main (10w) classes first.");
        }

        // Validate CAPSTONE prerequisite (optional — if provided, must be a MAIN class)
        if ("CAPSTONE".equalsIgnoreCase(classType) && req.prerequisiteClassId() != null) {
            ClassEntity prereq = classRepository.findById(req.prerequisiteClassId())
                    .orElseThrow(() -> ApiException.badRequest("Prerequisite class not found with id: " + req.prerequisiteClassId()));
            if (!"MAIN".equalsIgnoreCase(prereq.getClassType())) {
                throw ApiException.badRequest("Prerequisite class must be a MAIN (10w) class.");
            }
            // Block activating capstone if prerequisite not completed
            if ("Active".equalsIgnoreCase(status) && !"Completed".equalsIgnoreCase(prereq.getStatus())) {
                throw ApiException.badRequest(
                        "Cannot activate capstone class: prerequisite class '" + prereq.getClassCode()
                                + "' has not completed yet.");
            }
        }

        // Validate class dates
        if (req.startDate() != null && req.endDate() != null) {
            if (!req.endDate().isAfter(req.startDate())) {
                throw ApiException.badRequest("Class end date must be after start date.");
            }
        }

        // Validate lecturer exists if provided
        if (req.lecturerId() != null && !lecturerRepository.existsById(req.lecturerId())) {
            throw ApiException.badRequest("Lecturer not found with id: " + req.lecturerId());
        }
    }

    /**
     * Quick action: mark a class as Completed.
     * Only Active classes can be completed.
     */
    @Transactional
    public ClassEntity completeClass(Integer id) {
        ClassEntity cls = getById(id);
        if (!"Active".equalsIgnoreCase(cls.getStatus())) {
            throw ApiException.badRequest("Only Active classes can be completed. Current status: " + cls.getStatus());
        }
        cls.setStatus("Completed");
        ClassEntity saved = classRepository.save(cls);

        // Auto-complete all groups in this class
        var groups = groupRepository.findByClassId(id);
        for (var group : groups) {
            if (!"Completed".equalsIgnoreCase(group.getStatus())) {
                group.setStatus("Completed");
                groupRepository.save(group);
            }
        }

        // Auto-complete semester if ALL classes in it are now Completed
        List<ClassEntity> siblingClasses = classRepository.findBySemesterId(cls.getSemesterId());
        boolean allCompleted = siblingClasses.stream()
                .allMatch(c -> "Completed".equalsIgnoreCase(c.getStatus()));
        if (allCompleted) {
            var semester = semesterRepository.findById(cls.getSemesterId()).orElse(null);
            if (semester != null && "Active".equalsIgnoreCase(semester.getStatus())) {
                semester.setStatus("Completed");
                semesterRepository.save(semester);
            }
        }

        return saved;
    }

    /**
     * Quick action: activate a class.
     * Validates semester is active and prerequisite is completed (for CAPSTONE).
     */
    @Transactional
    public ClassEntity activateClass(Integer id) {
        ClassEntity cls = getById(id);
        if ("Active".equalsIgnoreCase(cls.getStatus())) {
            throw ApiException.badRequest("Class is already Active.");
        }
        if ("Completed".equalsIgnoreCase(cls.getStatus())) {
            throw ApiException.badRequest("Cannot re-activate a Completed class.");
        }

        // Semester must be active
        var semester = semesterRepository.findById(cls.getSemesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found"));
        if (!"Active".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest("Cannot activate class: semester '" + semester.getName() + "' is not active.");
        }

        // CAPSTONE: prerequisite must be completed
        if ("CAPSTONE".equalsIgnoreCase(cls.getClassType()) && cls.getPrerequisiteClassId() != null) {
            ClassEntity prereq = classRepository.findById(cls.getPrerequisiteClassId()).orElse(null);
            if (prereq != null && !"Completed".equalsIgnoreCase(prereq.getStatus())) {
                throw ApiException.badRequest(
                        "Cannot activate capstone class: prerequisite '" + prereq.getClassCode()
                                + "' has not completed yet (status: " + prereq.getStatus() + ").");
            }
        }

        cls.setStatus("Active");
        ClassEntity saved = classRepository.save(cls);

        // Promote PRE_ENROLLED students to ACTIVE
        var preEnrolled = enrollmentRepository.findByClassIdAndStatus(id, "PRE_ENROLLED");
        for (var enrollment : preEnrolled) {
            enrollment.setStatus("ACTIVE");
            enrollmentRepository.save(enrollment);
        }

        return saved;
    }
}



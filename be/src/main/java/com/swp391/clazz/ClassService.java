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

    private void ensureMainPhaseCompletedForCapstone(Integer semesterId) {
        List<ClassEntity> siblingClasses = classRepository.findBySemesterId(semesterId);
        List<ClassEntity> mainClasses = siblingClasses.stream()
                .filter(c -> "MAIN".equalsIgnoreCase(c.getClassType() != null ? c.getClassType() : "MAIN"))
                .toList();

        if (mainClasses.isEmpty()) {
            throw ApiException.badRequest("Cannot activate Capstone (3w): no Main (10w) classes found in this semester.");
        }

        ClassEntity firstNotCompleted = mainClasses.stream()
                .filter(c -> !"Completed".equalsIgnoreCase(c.getStatus()))
                .findFirst()
                .orElse(null);

        if (firstNotCompleted != null) {
            String code = firstNotCompleted.getClassCode() != null ? firstNotCompleted.getClassCode() : ("Class " + firstNotCompleted.getId());
            String st = firstNotCompleted.getStatus() != null ? firstNotCompleted.getStatus() : "Unknown";
            throw ApiException.badRequest(
                    "Cannot activate Capstone (3w): Main (10w) phase is not completed yet. Example: '" + code + "' is " + st + ".");
        }
    }

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
        var semester = semesterRepository.findById(req.semesterId()).orElse(null);
        String classType = req.classType() != null ? req.classType() : "MAIN";

        // Default statuses:
        // - Non-active semesters -> Inactive
        // - CAPSTONE (3w) should start Inactive; use activate endpoint when allowed
        // - MAIN (10w) in Active semester defaults to Active
        String status = req.status();
        if (status == null) {
            if (semester != null && !"Active".equalsIgnoreCase(semester.getStatus())) {
                status = "Inactive";
            } else if ("CAPSTONE".equalsIgnoreCase(classType)) {
                status = "Inactive";
            } else {
                status = "Active";
            }
        }

        // Safety: never allow Active status when semester is not Active
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

        var semester = semesterRepository.findById(entity.getSemesterId()).orElse(null);
        if (semester != null && "Completed".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest("Cannot edit class when semester is Completed.");
        }

        if (semester != null && "Active".equalsIgnoreCase(semester.getStatus())) {
            // Option B: allow editing only CAPSTONE classes that are currently Inactive
            boolean isCapstone = "CAPSTONE".equalsIgnoreCase(entity.getClassType());
            boolean isInactive = "Inactive".equalsIgnoreCase(entity.getStatus());
            if (!isCapstone || !isInactive) {
                throw ApiException.badRequest("Cannot edit classes while semester is Active (except Inactive Capstone/3w)." );
            }

            // While semester is Active, lock identity/state fields
            if (req.semesterId() != null && !req.semesterId().equals(entity.getSemesterId())) {
                throw ApiException.badRequest("Cannot move a class to another semester while semester is Active.");
            }
            if (req.classType() != null && !req.classType().equalsIgnoreCase(entity.getClassType())) {
                throw ApiException.badRequest("Cannot change class type while semester is Active.");
            }
            if (req.status() != null && !req.status().equalsIgnoreCase(entity.getStatus())) {
                throw ApiException.badRequest("Cannot change class status via Edit while semester is Active. Use Activate/Complete actions instead.");
            }
        }

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
         * Used by GroupService to block creating groups when the semester is not Active.
     */
    public void ensureSemesterActive(Integer classId) {
        ClassEntity cls = getById(classId);
        var semester = semesterRepository.findById(cls.getSemesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found for class"));
        if (!"Active".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest(
                    "Semester '" + semester.getName() + "' is not active (status: " + semester.getStatus()
                    + "). You can only create/manage groups when the semester is Active.");
        }
    }

    /**
     * Student direct class assignment (via students.class_id) is only allowed for MAIN (10w) classes
     * in UPCOMING semesters. CAPSTONE (3w) uses enrollment endpoint instead.
     */
    public void ensureCanAssignStudentToClass(Integer classId) {
        ClassEntity cls = getById(classId);
        if ("CAPSTONE".equalsIgnoreCase(cls.getClassType())) {
            throw ApiException.badRequest("Cannot assign student directly to a CAPSTONE (3w) class. Use enrollment instead.");
        }
        var semester = semesterRepository.findById(cls.getSemesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found for class"));
        if (!"Upcoming".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest(
                    "You can only add students to classes when the semester is Upcoming. (Semester '" + semester.getName() + "' is " + semester.getStatus() + ")");
        }
    }

    /**
     * CAPSTONE (3w) enrollment is allowed when:
     * - semester is UPCOMING (pre-enroll), OR
     * - semester is ACTIVE but capstone class is not ACTIVE yet (still in 10w phase).
     */
    public void ensureCanEnrollCapstone(Integer classId) {
        ClassEntity cls = getById(classId);
        if (!"CAPSTONE".equalsIgnoreCase(cls.getClassType())) {
            throw ApiException.badRequest("This enrollment endpoint is only for CAPSTONE (3w) classes.");
        }
        var semester = semesterRepository.findById(cls.getSemesterId())
                .orElseThrow(() -> ApiException.badRequest("Semester not found for class"));

        if ("Upcoming".equalsIgnoreCase(semester.getStatus())) {
            return;
        }
        if ("Active".equalsIgnoreCase(semester.getStatus())) {
            // If capstone class is already Active, the 3w phase has started → do not allow adding more students.
            if ("Active".equalsIgnoreCase(cls.getStatus())) {
                throw ApiException.badRequest("Capstone phase is running. You can only enroll students to 3w before it starts, or enroll to an Upcoming semester.");
            }
            return;
        }

        throw ApiException.badRequest("Semester is not eligible for enrollment (status: " + semester.getStatus() + ").");
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

        // Validate class type
        String classType = req.classType() != null ? req.classType() : "MAIN";
        if (!VALID_CLASS_TYPES.contains(classType)) {
            throw ApiException.badRequest("Invalid class type '" + classType + "'. Allowed values: MAIN, CAPSTONE.");
        }

        // Validate status
        String status = req.status();
        if (status == null) {
            if (!"Active".equalsIgnoreCase(semester.getStatus())) {
                status = "Inactive";
            } else if ("CAPSTONE".equalsIgnoreCase(classType)) {
                status = "Inactive";
            } else {
                status = "Active";
            }
        }
        if (!VALID_STATUSES.contains(status)) {
            throw ApiException.badRequest("Invalid status '" + status + "'. Allowed values: Active, Inactive, Completed.");
        }

        // CAPSTONE can only be Active after all MAIN (10w) classes are Completed (i.e., after 10w phase)
        if ("CAPSTONE".equalsIgnoreCase(classType) && "Active".equalsIgnoreCase(status)) {
            ensureMainPhaseCompletedForCapstone(req.semesterId());
        }

        // Block activating class if semester is not active
        if ("Active".equalsIgnoreCase(status) && !"Active".equalsIgnoreCase(semester.getStatus())) {
            throw ApiException.badRequest(
                    "Cannot set class to Active: semester '" + semester.getName() + "' is not active. Activate the semester first.");
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
     * Bulk operation: when a semester is marked Completed, all classes inside it
     * should be marked Completed as well (regardless of their current status).
     * Also completes all groups in those classes.
     */
    @Transactional
    public void completeAllClassesInSemester(Integer semesterId) {
        if (semesterId == null) return;
        List<ClassEntity> semClasses = classRepository.findBySemesterId(semesterId);
        for (var cls : semClasses) {
            if (!"Completed".equalsIgnoreCase(cls.getStatus())) {
                cls.setStatus("Completed");
                classRepository.save(cls);
            }

            Integer classId = cls.getId();
            if (classId == null) continue;
            var groups = groupRepository.findByClassId(classId);
            for (var group : groups) {
                if (!"Completed".equalsIgnoreCase(group.getStatus())) {
                    group.setStatus("Completed");
                    groupRepository.save(group);
                }
            }
        }
    }

    /**
     * Bulk operation: when a semester is marked Completed, all classes inside it
     * should be marked Completed as well (regardless of their current status).
     * Also completes all groups in those classes.
     */
    @Transactional
    public void completeAllClassesInSemester(Integer semesterId) {
        if (semesterId == null) return;
        List<ClassEntity> semClasses = classRepository.findBySemesterId(semesterId);
        for (var cls : semClasses) {
            if (!"Completed".equalsIgnoreCase(cls.getStatus())) {
                cls.setStatus("Completed");
                classRepository.save(cls);
            }

            Integer classId = cls.getId();
            if (classId == null) continue;
            var groups = groupRepository.findByClassId(classId);
            for (var group : groups) {
                if (!"Completed".equalsIgnoreCase(group.getStatus())) {
                    group.setStatus("Completed");
                    groupRepository.save(group);
                }
            }
        }
    }

    /**
     * Quick action: activate a class.
        * Validates semester is active.
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

        // CAPSTONE (3w) can only start after MAIN (10w) phase is completed
        if ("CAPSTONE".equalsIgnoreCase(cls.getClassType())) {
            ensureMainPhaseCompletedForCapstone(cls.getSemesterId());
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



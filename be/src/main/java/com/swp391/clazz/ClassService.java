package com.swp391.clazz;

import com.swp391.common.ApiException;
import com.swp391.group.StudentGroupRepository;
import com.swp391.student.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassService {
    private final ClassRepository classRepository;
    private final StudentGroupRepository groupRepository;
    private final StudentRepository studentRepository;

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
        if (classRepository.existsByClassCode(req.classCode())) {
            throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists. Please use a different code.");
        }
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
        if (!entity.getClassCode().equals(req.classCode()) && classRepository.existsByClassCode(req.classCode())) {
            throw ApiException.badRequest("Class code '" + req.classCode() + "' already exists.");
        }
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
}

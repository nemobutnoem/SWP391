package com.swp391.clazz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollmentEntity, Integer> {
    List<ClassEnrollmentEntity> findByStudentId(Integer studentId);
    List<ClassEnrollmentEntity> findByClassId(Integer classId);
    Optional<ClassEnrollmentEntity> findByStudentIdAndClassId(Integer studentId, Integer classId);
    boolean existsByStudentIdAndClassId(Integer studentId, Integer classId);
    List<ClassEnrollmentEntity> findByClassIdAndStatus(Integer classId, String status);
    long countByClassId(Integer classId);
}

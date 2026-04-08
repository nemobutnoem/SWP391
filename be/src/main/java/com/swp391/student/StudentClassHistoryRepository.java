package com.swp391.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentClassHistoryRepository extends JpaRepository<StudentClassHistoryEntity, Integer> {
    List<StudentClassHistoryEntity> findByStudentIdOrderByAssignedAtDesc(Integer studentId);

    @Query("select h from StudentClassHistoryEntity h where h.studentId = :studentId and h.unassignedAt is null")
    Optional<StudentClassHistoryEntity> findOpenByStudentId(@Param("studentId") Integer studentId);
}

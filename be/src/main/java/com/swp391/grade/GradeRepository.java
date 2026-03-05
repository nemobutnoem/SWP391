package com.swp391.grade;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepository extends JpaRepository<GradeEntity, Integer> {
    List<GradeEntity> findByGroupId(Integer groupId);

    List<GradeEntity> findByLecturerId(Integer lecturerId);
}

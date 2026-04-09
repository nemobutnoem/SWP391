package com.swp391.clazz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassRepository extends JpaRepository<ClassEntity, Integer> {
	List<ClassEntity> findByLecturerId(Integer lecturerId);

	List<ClassEntity> findBySemesterId(Integer semesterId);

	boolean existsBySemesterIdAndClassCode(Integer semesterId, String classCode);

	boolean existsBySemesterIdAndClassCodeAndIdNot(Integer semesterId, String classCode, Integer id);
}

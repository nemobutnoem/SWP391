package com.swp391.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGroupRepository extends JpaRepository<StudentGroupEntity, Integer> {
	List<StudentGroupEntity> findByClassId(Integer classId);
	List<StudentGroupEntity> findByClassIdIn(java.util.Collection<Integer> classIds);
	List<StudentGroupEntity> findByLecturerId(Integer lecturerId);
	List<StudentGroupEntity> findByProjectId(Integer projectId);
	Optional<StudentGroupEntity> findByIdAndClassId(Integer id, Integer classId);
}

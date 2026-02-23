package com.swp391.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGroupRepository extends JpaRepository<StudentGroupEntity, Integer> {
	List<StudentGroupEntity> findByClassId(Integer classId);
	Optional<StudentGroupEntity> findByIdAndClassId(Integer id, Integer classId);
}

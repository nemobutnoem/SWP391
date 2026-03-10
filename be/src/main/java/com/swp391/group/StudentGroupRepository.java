package com.swp391.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGroupRepository extends JpaRepository<StudentGroupEntity, Integer> {
	List<StudentGroupEntity> findByClassId(Integer classId);
<<<<<<< Updated upstream
=======

	List<StudentGroupEntity> findByClassIdIn(java.util.Collection<Integer> classIds);

	List<StudentGroupEntity> findByLecturerId(Integer lecturerId);

>>>>>>> Stashed changes
	Optional<StudentGroupEntity> findByIdAndClassId(Integer id, Integer classId);

	/** Kiểm tra đề tài có đang được nhóm nào sử dụng không */
	boolean existsByProjectId(Integer projectId);
}

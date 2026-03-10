package com.swp391.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<StudentEntity, Integer> {
	Optional<StudentEntity> findByUserId(Integer userId);
<<<<<<< Updated upstream
=======

	Optional<StudentEntity> findByEmailIgnoreCase(String email);

	long countByClassId(Integer classId);

	boolean existsByStudentCode(String studentCode);

	boolean existsByEmail(String email);

	boolean existsByStudentCodeAndIdNot(String studentCode, Integer id);

	boolean existsByEmailAndIdNot(String email, Integer id);
>>>>>>> Stashed changes
}

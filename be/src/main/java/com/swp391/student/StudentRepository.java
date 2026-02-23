package com.swp391.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<StudentEntity, Integer> {
	Optional<StudentEntity> findByUserId(Integer userId);
}

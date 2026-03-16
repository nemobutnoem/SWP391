package com.swp391.lecturer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LecturerRepository extends JpaRepository<LecturerEntity, Integer> {
    Optional<LecturerEntity> findByUserId(Integer userId);
    Optional<LecturerEntity> findByEmailIgnoreCase(String email);
}

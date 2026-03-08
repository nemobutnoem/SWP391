package com.swp391.semester;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SemesterRepository extends JpaRepository<SemesterEntity, Integer> {
    Optional<SemesterEntity> findByCode(String code);
}

package com.swp391.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LecturerRepository extends JpaRepository<LecturerEntity, Integer> {
    Optional<LecturerEntity> findByUserId(Integer userId);
}

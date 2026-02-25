package com.swp391.demo.repository;

import com.swp391.demo.entity.ProjectConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectConfigRepository extends JpaRepository<ProjectConfig, Long> {
    Optional<ProjectConfig> findByGroupId(Long groupId);
}

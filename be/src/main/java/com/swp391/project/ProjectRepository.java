package com.swp391.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Integer> {
	List<ProjectEntity> findBySemesterId(Integer semesterId);
}

package com.swp391.jira;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JiraProjectRepository extends JpaRepository<JiraProjectEntity, Integer> {
	Optional<JiraProjectEntity> findByGroupId(Integer groupId);
}

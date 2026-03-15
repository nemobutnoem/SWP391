package com.swp391.integration.jira;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskCommentEntity, Integer> {
	List<TaskCommentEntity> findByTaskIdOrderByCreatedAtDesc(Integer taskId);
	java.util.Optional<TaskCommentEntity> findByJiraCommentId(String jiraCommentId);
}

package com.swp391.jira;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JiraIssueRepository extends JpaRepository<JiraIssueEntity, Integer> {
	List<JiraIssueEntity> findByGroupId(Integer groupId);
	Optional<JiraIssueEntity> findByGroupIdAndJiraIssueKey(Integer groupId, String jiraIssueKey);
	Optional<JiraIssueEntity> findByGroupIdAndJiraIssueId(Integer groupId, String jiraIssueId);
}


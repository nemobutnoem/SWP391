package com.swp391.jira;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "jira_issues", schema = "dbo")
public class JiraIssueEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "jira_issue_id")
	private String jiraIssueId;

	@Column(name = "jira_issue_key")
	private String jiraIssueKey;

	@Column(name = "issue_type")
	private String issueType;

	@Column(name = "summary")
	private String summary;

	@Column(name = "description")
	private String description;

	@Column(name = "status")
	private String status;

	@Column(name = "assignee_user_id")
	private Integer assigneeUserId;

	@Column(name = "reporter_user_id")
	private Integer reporterUserId;

	@Column(name = "jira_due_date")
	private LocalDate jiraDueDate;

	@Column(name = "jira_updated_at")
	private LocalDateTime jiraUpdatedAt;
}

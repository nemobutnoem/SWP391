package com.swp391.integration.jira;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "task_comments", schema = "dbo")
public class TaskCommentEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "task_id", nullable = false)
	private Integer taskId;

	@Column(name = "user_id")
	private Integer userId;

	@Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
	private String content;

	@Column(name = "jira_comment_id")
	private String jiraCommentId;

	@Column(name = "jira_author_name")
	private String jiraAuthorName;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	void prePersist() {
		var now = LocalDateTime.now();
		if (createdAt == null) createdAt = now;
		if (updatedAt == null) updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}

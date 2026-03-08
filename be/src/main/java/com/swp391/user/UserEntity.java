package com.swp391.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "users", schema = "dbo")
public class UserEntity {
	public static final String UNSET_JIRA_ACCOUNT_ID_PREFIX = "__UNSET_JIRA__:";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "account")
	private String account;

	@Column(name = "role")
	private String role;

	@Column(name = "github_username")
	private String githubUsername;

	@Column(name = "jira_account_id")
	private String jiraAccountId;

	@Column(name = "status")
	private String status;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;

	// Local auth (not in DBML originally). Keeping it as a nullable column
	// is a pragmatic addition to support JWT+password login.
	@Column(name = "password_hash")
	private String passwordHash;

	@PrePersist
	@PreUpdate
	void ensureJiraAccountIdUniqueInSqlServer() {
		// SQL Server UNIQUE index allows only a single NULL, so we store a unique
		// placeholder for "unset" Jira account IDs and normalize it in API/business logic.
		if (jiraAccountId == null || jiraAccountId.isBlank()) {
			jiraAccountId = UNSET_JIRA_ACCOUNT_ID_PREFIX + UUID.randomUUID();
		}
	}

	public static boolean isUnsetJiraAccountId(String jiraAccountId) {
		return jiraAccountId != null && jiraAccountId.startsWith(UNSET_JIRA_ACCOUNT_ID_PREFIX);
	}

	public static String normalizeJiraAccountId(String jiraAccountId) {
		return isUnsetJiraAccountId(jiraAccountId) ? null : jiraAccountId;
	}
}

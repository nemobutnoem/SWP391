package com.swp391.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users", schema = "dbo")
public class UserEntity {
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
}

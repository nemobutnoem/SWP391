package com.swp391.repo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_repositories", schema = "dbo")
public class GithubRepositoryEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "repo_url")
	private String repoUrl;

	@Column(name = "repo_owner")
	private String repoOwner;

	@Column(name = "repo_name")
	private String repoName;

	@Column(name = "default_branch")
	private String defaultBranch;

	@Column(name = "visibility")
	private String visibility;

	@Column(name = "is_active")
	private Boolean isActive;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;
}

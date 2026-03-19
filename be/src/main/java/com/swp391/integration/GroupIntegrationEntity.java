package com.swp391.integration;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "group_integrations", schema = "dbo")
public class GroupIntegrationEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "jira_base_url")
	private String jiraBaseUrl;

	@Column(name = "jira_email")
	private String jiraEmail;

	@Column(name = "jira_api_token")
	private String jiraApiToken;

	@Column(name = "github_token")
	private String githubToken;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;
}

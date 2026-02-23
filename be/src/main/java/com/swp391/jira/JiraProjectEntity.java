package com.swp391.jira;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "jira_projects", schema = "dbo")
public class JiraProjectEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "jira_project_key")
	private String jiraProjectKey;

	@Column(name = "jira_project_id")
	private String jiraProjectId;

	@Column(name = "jira_base_url")
	private String jiraBaseUrl;

	@Column(name = "project_name")
	private String projectName;

	@Column(name = "status")
	private String status;
}

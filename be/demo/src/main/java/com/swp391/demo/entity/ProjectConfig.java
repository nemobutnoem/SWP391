package com.swp391.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", unique = true, nullable = false)
    private Long groupId;

    @Column(name = "jira_url")
    private String jiraUrl;

    @Column(name = "jira_token")
    private String jiraToken;

    @Column(name = "github_repo_url")
    private String githubRepoUrl;

    @Column(name = "github_token")
    private String githubToken;
}

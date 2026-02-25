package com.swp391.demo.controller;

import com.swp391.demo.service.JiraService;
import com.swp391.demo.service.GitHubService;
import com.swp391.demo.config.JiraProperties;
import com.swp391.demo.config.GitHubProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test-integration")
@RequiredArgsConstructor
public class IntegrationController {

    private final JiraProperties jiraProperties;
    private final GitHubProperties githubProperties;
    private final JiraService jiraService;
    private final GitHubService githubService;

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> testConfig() {
        Map<String, Object> configMap = new HashMap<>();

        // Trả về thông tin Jira (ẩn token)
        Map<String, String> jiraInfo = new HashMap<>();
        jiraInfo.put("baseUrl", jiraProperties.getBaseUrl());
        jiraInfo.put("email", jiraProperties.getEmail());
        jiraInfo.put("tokenStatus", jiraProperties.getApiToken().isEmpty() ? "MISSING" : "LOADED");
        configMap.put("jira", jiraInfo);

        // Trả về thông tin GitHub (ẩn token)
        Map<String, String> githubInfo = new HashMap<>();
        githubInfo.put("tokenStatus", githubProperties.getToken().isEmpty() ? "MISSING" : "LOADED");
        configMap.put("github", githubInfo);

        return ResponseEntity.ok(configMap);
    }

    @GetMapping("/sync-jira")
    public ResponseEntity<String> testJiraSync() {
        jiraService.fetchJiraTasks();
        return ResponseEntity.ok("Jira sync triggered. Check server console for logs.");
    }

    @GetMapping("/sync-github")
    public ResponseEntity<String> testGitHubSync() {
        githubService.fetchCommits();
        return ResponseEntity.ok("GitHub sync triggered. Check server console for logs.");
    }
}

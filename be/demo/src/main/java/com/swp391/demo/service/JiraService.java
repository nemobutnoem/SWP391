package com.swp391.demo.service;

import com.swp391.demo.config.JiraProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JiraService {
    private final JiraProperties jiraProperties;

    public void fetchJiraTasks() {
        String url = jiraProperties.getBaseUrl();
        String token = jiraProperties.getApiToken();
        // Logic gọi Atlassian API sẽ ở đây
        System.out.println("Connecting to Jira: " + url);
    }
}

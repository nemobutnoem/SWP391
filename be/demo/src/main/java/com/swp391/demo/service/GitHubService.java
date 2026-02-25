package com.swp391.demo.service;

import com.swp391.demo.config.GitHubProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GitHubService {
    private final GitHubProperties githubProperties;

    public void fetchCommits() {
        String token = githubProperties.getToken();
        // Logic gọi GitHub API sẽ ở đây
        System.out.println("Using GitHub Token: " + (token.isEmpty() ? "None" : "********"));
    }
}

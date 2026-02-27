package com.swp391.github;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GitHubClient {
	private final RestClient restClient;

	public GitHubClient(RestClient.Builder builder) {
		this.restClient = builder
				.baseUrl("https://api.github.com")
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader("X-GitHub-Api-Version", "2022-11-28")
				.build();
	}

	public JsonNode listBranches(String owner, String repo, String token) {
		var req = restClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/repos/{owner}/{repo}/branches")
						.queryParam("per_page", 100)
						.build(owner, repo))
				.header(HttpHeaders.ACCEPT, "application/vnd.github+json");
		if (token != null && !token.isBlank()) {
			req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		return req.retrieve().body(JsonNode.class);
	}

	public JsonNode listCommits(String owner, String repo, String sha, String sinceIso, String token) {
		var req = restClient.get()
				.uri(uriBuilder -> {
					var b = uriBuilder.path("/repos/{owner}/{repo}/commits");
					b = b.queryParam("per_page", 100);
					if (sha != null && !sha.isBlank()) {
						b = b.queryParam("sha", sha);
					}
					if (sinceIso != null && !sinceIso.isBlank()) {
						b = b.queryParam("since", sinceIso);
					}
					return b.build(owner, repo);
				})
				.header(HttpHeaders.ACCEPT, "application/vnd.github+json");
		if (token != null && !token.isBlank()) {
			req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		return req.retrieve().body(JsonNode.class);
	}
}

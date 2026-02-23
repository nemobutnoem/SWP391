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

	public JsonNode listCommits(String owner, String repo, String sinceIso, String token) {
		var req = restClient.get()
				.uri(uriBuilder -> {
					var b = uriBuilder.path("/repos/{owner}/{repo}/commits");
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

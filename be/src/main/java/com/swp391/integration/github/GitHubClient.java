package com.swp391.integration.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GitHubClient {
	private static final int MAX_PAGES = 20;
	private final RestClient restClient;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public GitHubClient(RestClient.Builder builder) {
		this.restClient = builder
				.baseUrl("https://api.github.com")
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader("X-GitHub-Api-Version", "2022-11-28")
				.build();
	}

	public JsonNode listBranches(String owner, String repo, String token) {
		ArrayNode all = objectMapper.createArrayNode();
		for (int page = 1; page <= MAX_PAGES; page++) {
			final int p = page;
			var req = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/repos/{owner}/{repo}/branches")
							.queryParam("per_page", 100)
							.queryParam("page", p)
							.build(owner, repo))
					.header(HttpHeaders.ACCEPT, "application/vnd.github+json");
			if (token != null && !token.isBlank()) {
				req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
			}
			JsonNode page_result = req.retrieve().body(JsonNode.class);
			if (page_result == null || !page_result.isArray() || page_result.isEmpty()) break;
			for (JsonNode item : page_result) all.add(item);
			if (page_result.size() < 100) break;
		}
		return all;
	}

	public JsonNode getCommit(String owner, String repo, String sha, String token) {
		var req = restClient.get()
				.uri("/repos/{owner}/{repo}/commits/{sha}", owner, repo, sha)
				.header(HttpHeaders.ACCEPT, "application/vnd.github+json");
		if (token != null && !token.isBlank()) {
			req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		return req.retrieve().body(JsonNode.class);
	}

	public JsonNode listCommits(String owner, String repo, String sha, String sinceIso, String token) {
		ArrayNode all = objectMapper.createArrayNode();
		for (int page = 1; page <= MAX_PAGES; page++) {
			final int p = page;
			var req = restClient.get()
					.uri(uriBuilder -> {
						var b = uriBuilder.path("/repos/{owner}/{repo}/commits");
						b = b.queryParam("per_page", 100);
						b = b.queryParam("page", p);
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
			JsonNode page_result = req.retrieve().body(JsonNode.class);
			if (page_result == null || !page_result.isArray() || page_result.isEmpty()) break;
			for (JsonNode item : page_result) all.add(item);
			if (page_result.size() < 100) break;
		}
		return all;
	}
}

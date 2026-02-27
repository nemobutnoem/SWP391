package com.swp391.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class JiraClient {
	private static final Logger log = LoggerFactory.getLogger(JiraClient.class);
	private static final List<String> DEFAULT_SEARCH_FIELDS = List.of(
			"summary",
			"issuetype",
			"assignee",
			"status",
			"duedate",
			"updated",
			"created"
	);

	private final RestClient.Builder builder;
	private final ObjectMapper objectMapper;
	private final boolean minimalSearchPayload;

	public JiraClient(
			RestClient.Builder builder,
			ObjectMapper objectMapper,
			@Value("${jira.debug.minimal-search-payload:false}") boolean minimalSearchPayload
	) {
		this.builder = builder;
		this.objectMapper = objectMapper;
		this.minimalSearchPayload = minimalSearchPayload;
	}

	public JsonNode getIssueTransitions(String baseUrl, String email, String apiToken, String issueKey) {
		return buildClient(baseUrl, email, apiToken).get()
				.uri("/rest/api/3/issue/{issueKey}/transitions", issueKey)
				.retrieve()
				.body(JsonNode.class);
	}

	public void transitionIssue(String baseUrl, String email, String apiToken, String issueKey, String transitionId) {
		buildClient(baseUrl, email, apiToken).post()
				.uri("/rest/api/3/issue/{issueKey}/transitions", issueKey)
				.contentType(MediaType.APPLICATION_JSON)
				.body("{\"transition\":{\"id\":\"" + transitionId + "\"}}")
				.retrieve()
				.toBodilessEntity();
	}

	public void assignIssue(String baseUrl, String email, String apiToken, String issueKey, String accountId) {
		Map<String, Object> body = new LinkedHashMap<>();
		// Jira Cloud expects `accountId`. Setting it to null unassigns.
		body.put("accountId", accountId);
		buildClient(baseUrl, email, apiToken).put()
				.uri("/rest/api/3/issue/{issueKey}/assignee", issueKey)
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.retrieve()
				.toBodilessEntity();
	}

	public JsonNode searchIssues(String baseUrl, String email, String apiToken, String jql, String nextPageToken, int maxResults) {
		// Jira Cloud deprecated/removed the old search endpoint for some tenants.
		// Use enhanced search: POST /rest/api/3/search/jql
		// Note: this endpoint uses nextPageToken-based pagination (no startAt).
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("jql", jql);
		body.put("maxResults", maxResults);
		if (nextPageToken != null && !nextPageToken.isBlank()) {
			body.put("nextPageToken", nextPageToken);
		}
		if (!minimalSearchPayload) {
			// Keep this list minimal: our sync only needs summary/type/status.
			// Requesting invalid custom fields can cause Jira to reject the payload with 400.
			body.put("fields", DEFAULT_SEARCH_FIELDS);
		}

		try {
			if (log.isDebugEnabled()) {
				log.debug("Jira POST /rest/api/3/search/jql payload: {}", objectMapper.writeValueAsString(body));
			}
		} catch (Exception ignored) {
			// Best-effort logging only.
		}

		try {
			return buildClient(baseUrl, email, apiToken).post()
					.uri("/rest/api/3/search/jql")
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.body(JsonNode.class);
		} catch (RestClientResponseException ex) {
			String jiraBody = null;
			try {
				jiraBody = ex.getResponseBodyAsString();
			} catch (Exception ignored) {
				// ignore
			}
			log.warn("Jira search/jql failed (status={}): {}", ex.getStatusCode().value(), jiraBody);
			throw ex;
		}
	}

	private RestClient buildClient(String baseUrl, String email, String apiToken) {
		String basic = (email == null ? "" : email) + ":" + (apiToken == null ? "" : apiToken);
		String auth = "Basic " + Base64.getEncoder().encodeToString(basic.getBytes(StandardCharsets.UTF_8));
		return builder
				.baseUrl(baseUrl)
				.defaultHeader(HttpHeaders.AUTHORIZATION, auth)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}
}


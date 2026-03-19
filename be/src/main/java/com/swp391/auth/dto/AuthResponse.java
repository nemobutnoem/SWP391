package com.swp391.auth.dto;

public record AuthResponse(
		String accessToken,
		String tokenType,
		Integer userId,
		String role
) {
	public static AuthResponse bearer(String accessToken, Integer userId, String role) {
		return new AuthResponse(accessToken, "Bearer", userId, role);
	}
}

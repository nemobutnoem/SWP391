package com.swp391.auth.dto;

public record AuthResponse(
    String type,
    String token,
    Integer userId,
    String role
) {
    public static AuthResponse bearer(String token, Integer userId, String role) {
        return new AuthResponse("Bearer", token, userId, role);
    }
}

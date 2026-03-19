package com.swp391.auth.dto;

public record AuthResponse(
<<<<<<< HEAD
<<<<<<< HEAD
		String accessToken,
		String tokenType,
		Integer userId,
		String role
) {
	public static AuthResponse bearer(String accessToken, Integer userId, String role) {
		return new AuthResponse(accessToken, "Bearer", userId, role);
	}
=======
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
    String type,
    String token,
    Integer userId,
    String role
) {
    public static AuthResponse bearer(String token, Integer userId, String role) {
        return new AuthResponse("Bearer", token, userId, role);
    }
<<<<<<< HEAD
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}

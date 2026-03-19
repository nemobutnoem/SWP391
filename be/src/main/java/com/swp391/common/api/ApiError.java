package com.swp391.common.api;

<<<<<<< HEAD
<<<<<<< HEAD
import java.time.Instant;
import java.util.Map;

public record ApiError(
		Instant timestamp,
		int status,
		String error,
		String message,
		String path,
		Map<String, Object> details
) {
	public static ApiError of(int status, String error, String message, String path, Map<String, Object> details) {
		return new ApiError(Instant.now(), status, error, message, path, details);
	}
=======
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
import java.util.Map;

public record ApiError(
    int status,
    String error,
    String message,
    String path,
    Map<String, Object> details
) {
    public static ApiError of(int status, String error, String message, String path, Map<String, Object> details) {
        return new ApiError(status, error, message, path, details);
    }
<<<<<<< HEAD
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}

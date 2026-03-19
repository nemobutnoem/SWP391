package com.swp391.common.api;

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
}

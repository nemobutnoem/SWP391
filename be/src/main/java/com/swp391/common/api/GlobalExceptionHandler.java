package com.swp391.common.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
		var body = ApiError.of(400, "Bad Request", ex.getMessage(), request.getRequestURI(), null);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		Map<String, Object> details = new HashMap<>();
		Map<String, String> fieldErrors = new HashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(fe -> fieldErrors.put(fe.getField(), fe.getDefaultMessage()));
		details.put("fields", fieldErrors);
		var body = ApiError.of(400, "Bad Request", "Validation failed", request.getRequestURI(), details);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(SecurityException.class)
	public ResponseEntity<ApiError> handleSecurity(SecurityException ex, HttpServletRequest request) {
		var body = ApiError.of(403, "Forbidden", ex.getMessage(), request.getRequestURI(), null);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
		var body = ApiError.of(400, "Bad Request", "Malformed JSON request", request.getRequestURI(), null);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiError> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
		var body = ApiError.of(405, "Method Not Allowed", ex.getMessage(), request.getRequestURI(), null);
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest request) {
		var body = ApiError.of(500, "Internal Server Error", ex.getMessage(), request.getRequestURI(), null);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}
}

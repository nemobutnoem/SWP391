package com.swp391.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.common.api.ApiError;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        ApiError error = ApiError.of(HttpStatus.FORBIDDEN.value(), "Forbidden", accessDeniedException.getMessage(), request.getRequestURI(), null);
        new ObjectMapper().writeValue(response.getOutputStream(), error);
    }
}

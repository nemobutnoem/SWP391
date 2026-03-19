package com.swp391.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.common.api.ApiError;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        ApiError error = ApiError.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", authException.getMessage(), request.getRequestURI(), null);
        new ObjectMapper().writeValue(response.getOutputStream(), error);
    }
}

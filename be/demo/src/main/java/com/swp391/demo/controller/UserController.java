package com.swp391.demo.controller;

import com.swp391.demo.entity.User;
import com.swp391.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private com.swp391.demo.security.JwtUtils jwtUtils;

    @Autowired
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.saveUser(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(), loginRequest.getPassword()));

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(loginRequest.getUsername());

        return ResponseEntity.ok(new JwtResponse(jwt));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateRole(@PathVariable Long id, @RequestParam String role) {
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    // Simple DTOs for login
    public static class LoginRequest {
        private String username;
        private String password;

        // getters and setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class JwtResponse {
        private String token;

        public JwtResponse(String token) {
            this.token = token;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }
}

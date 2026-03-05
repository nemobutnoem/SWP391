package com.swp391.auth;

import com.swp391.auth.dto.AuthResponse;
import com.swp391.auth.dto.LoginRequest;
import com.swp391.auth.dto.RegisterRequest;
import com.swp391.security.JwtService;
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.swp391.auth.dto.GoogleLoginRequest;
import com.swp391.user.UserEntity;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final boolean allowRegister;

	public AuthController(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			@Value("${app.auth.allow-register:false}") boolean allowRegister) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.allowRegister = allowRegister;
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		var user = userRepository.findByAccount(request.account())
				.orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
		if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Invalid credentials");
		}
		String role = user.getRole() == null ? "TEAM_MEMBER" : user.getRole();
		String token = jwtService.generateAccessToken(user.getId(), role);
		return AuthResponse.bearer(token, user.getId(), role);
	}

	@PostMapping("/register")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		if (!allowRegister) {
			throw new SecurityException("Register is disabled");
		}
		userRepository.findByAccount(request.account()).ifPresent(u -> {
			throw new IllegalArgumentException("Account already exists");
		});
		var user = new com.swp391.user.UserEntity();
		user.setAccount(request.account());
		user.setRole(request.role());
		user.setStatus("active");
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user = userRepository.save(user);
		String token = jwtService.generateAccessToken(user.getId(), user.getRole());
		return AuthResponse.bearer(token, user.getId(), user.getRole());
	}

	@PostMapping("/google")
	public AuthResponse googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
		try {
			// In production, inject client ID from application.yml
			// Since we don't have a real one yet from the user, we'll configure a generic
			// verifier for now
			// or temporarily bypass the strict audience check until the client ID is ready.
			// Normally: new GoogleIdTokenVerifier.Builder(transport,
			// jsonFactory).setAudience(Collections.singletonList(CLIENT_ID)).build();
			var transport = new NetHttpTransport();
			var jsonFactory = new GsonFactory();
			var verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
					// Disable audience verification for now since CLIENT_ID is a placeholder on FE
					// .setAudience(Collections.singletonList("YOUR_GOOGLE_CLIENT_ID"))
					.build();

			GoogleIdToken idToken = verifier.verify(request.credential());
			if (idToken == null) {
				throw new SecurityException("Invalid ID token.");
			}
			GoogleIdToken.Payload payload = idToken.getPayload();

			String email = payload.getEmail();
			if (email == null || (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn"))) {
				throw new SecurityException("Only FPT University Google accounts are allowed.");
			}

			String accountName = email.split("@")[0];

			UserEntity user = userRepository.findByAccount(accountName)
					.orElseGet(() -> {
						var newUser = new UserEntity();
						newUser.setAccount(accountName);
						newUser.setRole("TEAM_MEMBER"); // Default role
						newUser.setStatus("active");
						return userRepository.save(newUser);
					});

			String token = jwtService.generateAccessToken(user.getId(), user.getRole());
			return AuthResponse.bearer(token, user.getId(), user.getRole());

		} catch (Exception e) {
			throw new SecurityException("Google authentication failed: " + e.getMessage());
		}
	}
}

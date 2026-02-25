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
			@Value("${app.auth.allow-register:false}") boolean allowRegister
	) {
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
}


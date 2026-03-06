package com.swp391.auth;

import com.swp391.auth.dto.AuthResponse;
import com.swp391.auth.dto.LoginRequest;
import com.swp391.auth.dto.RegisterRequest;
import com.swp391.security.JwtService;
import com.swp391.user.UserRepository;
import com.swp391.student.StudentRepository;
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
	private final StudentRepository studentRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final boolean allowRegister;

	public AuthController(
			UserRepository userRepository,
			StudentRepository studentRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			@Value("${app.auth.allow-register:false}") boolean allowRegister) {
		this.userRepository = userRepository;
		this.studentRepository = studentRepository;
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
		// Verify Google ID token
		var transport = new NetHttpTransport();
		var jsonFactory = new GsonFactory();
		GoogleIdToken idToken;
		try {
			var verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
					.build();
			idToken = verifier.verify(request.credential());
		} catch (Exception e) {
			throw new SecurityException("Google token verification failed: " + e.getMessage());
		}
		if (idToken == null) {
			throw new SecurityException("Invalid Google ID token.");
		}

		GoogleIdToken.Payload payload = idToken.getPayload();
		String email = payload.getEmail();
		if (email == null || (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn"))) {
			throw new SecurityException("Only FPT University Google accounts are allowed.");
		}

		String accountName = email.split("@")[0];

		// 1) Try to find existing user by account name
		UserEntity user = userRepository.findByAccount(accountName).orElse(null);

		// 2) If not found, check if a student record exists with this email
		//    and use the user linked to that student
		if (user == null) {
			var studentOpt = studentRepository.findByEmailIgnoreCase(email);
			if (studentOpt.isPresent() && studentOpt.get().getUserId() != null) {
				user = userRepository.findById(studentOpt.get().getUserId()).orElse(null);
			}
		}

		// 3) If still not found, create a new user and a matching student record
		if (user == null) {
			var newUser = new UserEntity();
			newUser.setAccount(accountName);
			newUser.setRole("TEAM_MEMBER");
			newUser.setStatus("active");
			user = userRepository.save(newUser);
		}

		String token = jwtService.generateAccessToken(user.getId(), user.getRole());
		return AuthResponse.bearer(token, user.getId(), user.getRole());
	}
}

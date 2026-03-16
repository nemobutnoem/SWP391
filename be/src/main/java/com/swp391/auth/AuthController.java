package com.swp391.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.swp391.auth.dto.AuthResponse;
import com.swp391.auth.dto.GoogleLoginRequest;
import com.swp391.auth.dto.LoginRequest;
import com.swp391.auth.dto.RegisterRequest;
import com.swp391.lecturer.LecturerEntity;
import com.swp391.lecturer.LecturerRepository;
import com.swp391.security.JwtService;
import com.swp391.student.StudentEntity;
import com.swp391.student.StudentRepository;
import com.swp391.user.UserEntity;
import com.swp391.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final boolean allowRegister;

    public AuthController(
            UserRepository userRepository,
            StudentRepository studentRepository,
            LecturerRepository lecturerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.auth.allow-register:false}") boolean allowRegister) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.lecturerRepository = lecturerRepository;
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
        if (email == null || (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn") && !email.endsWith("@fu.edu.vn"))) {
            throw new SecurityException("Only FPT University Google accounts are allowed.");
        }

        String desiredRole = normalizeGoogleRole(request.accountType());
        String accountName = email.split("@")[0];
        String studentCode = defaultStudentCode(email);
        String displayName = payload.get("name") == null ? accountName : String.valueOf(payload.get("name"));

        UserEntity user = userRepository.findByAccount(accountName).orElse(null);

        if (user == null && studentCode != null) {
            user = userRepository.findByAccount(studentCode).orElse(null);
        }

        if (user == null) {
            var studentOpt = studentRepository.findByEmailIgnoreCase(email);
            if (studentOpt.isPresent() && studentOpt.get().getUserId() != null) {
                user = userRepository.findById(studentOpt.get().getUserId()).orElse(null);
            }
        }

        if (user == null) {
            var lecturerOpt = lecturerRepository.findByEmailIgnoreCase(email);
            if (lecturerOpt.isPresent() && lecturerOpt.get().getUserId() != null) {
                user = userRepository.findById(lecturerOpt.get().getUserId()).orElse(null);
            }
        }

        if (user == null) {
            var newUser = new UserEntity();
            newUser.setAccount(accountName);
            newUser.setRole(desiredRole);
            newUser.setStatus("active");
            user = userRepository.save(newUser);
        } else {
            boolean linkedStudent = studentRepository.findByUserId(user.getId()).isPresent();
            boolean linkedLecturer = lecturerRepository.findByUserId(user.getId()).isPresent();
            if (!linkedStudent && !linkedLecturer && desiredRole != null && !desiredRole.equalsIgnoreCase(user.getRole())) {
                user.setRole(desiredRole);
                user = userRepository.save(user);
            }
        }

        ensureProfileForGoogleLogin(user, email, displayName, desiredRole, studentCode);

        String finalRole = user.getRole() == null ? "TEAM_MEMBER" : user.getRole();
        String token = jwtService.generateAccessToken(user.getId(), finalRole);
        return AuthResponse.bearer(token, user.getId(), finalRole);
    }

    private void ensureProfileForGoogleLogin(UserEntity user, String email, String displayName, String desiredRole, String studentCode) {
        if (user == null) return;

        boolean hasStudentProfile = studentRepository.findByUserId(user.getId()).isPresent();
        boolean hasLecturerProfile = lecturerRepository.findByUserId(user.getId()).isPresent();

        if (hasStudentProfile || hasLecturerProfile) {
            return;
        }

        if ("LECTURER".equalsIgnoreCase(desiredRole)) {
            LecturerEntity lecturer = new LecturerEntity();
            lecturer.setUserId(user.getId());
            lecturer.setFullName(displayName);
            lecturer.setEmail(email);
            lecturer.setDepartment("Software Engineering");
            lecturer.setStatus("Active");
            lecturerRepository.save(lecturer);
            user.setRole("LECTURER");
            userRepository.save(user);
            return;
        }

        StudentEntity student = new StudentEntity();
        student.setUserId(user.getId());
        student.setFullName(displayName);
        student.setStudentCode(studentCode);
        student.setEmail(email);
        student.setMajor("SE");
        student.setStatus("Active");
        studentRepository.save(student);
        user.setRole("TEAM_MEMBER");
        if (user.getAccount() == null || user.getAccount().isBlank()) {
            user.setAccount(studentCode != null ? studentCode : email.split("@")[0]);
        }
        userRepository.save(user);
    }

    private String defaultStudentCode(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) return "STUDENT";
        String localPart = email.substring(0, email.indexOf("@")).trim();
        if (localPart.isBlank()) return "STUDENT";
        String normalized = localPart.length() <= 8 ? localPart : localPart.substring(localPart.length() - 8);
        return normalized.toUpperCase(java.util.Locale.ROOT);
    }

    private String normalizeGoogleRole(String accountType) {
        String value = String.valueOf(accountType == null ? "" : accountType).trim().toUpperCase();
        if ("LECTURER".equals(value)) return "LECTURER";
        return "TEAM_MEMBER";
    }
}

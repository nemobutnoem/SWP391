package com.swp391.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    public record UserDto(
            Integer id,
            String account,
            String role,
            @JsonProperty("github_username") String githubUsername,
            @JsonProperty("jira_account_id") String jiraAccountId,
            String status,
            @JsonProperty("created_at") LocalDateTime createdAt,
            @JsonProperty("updated_at") LocalDateTime updatedAt) {
    }

    @GetMapping
    public List<UserDto> list(Authentication auth) {
        var principal = (UserPrincipal) auth.getPrincipal();
        ensureAdmin(principal);
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    private void ensureAdmin(UserPrincipal principal) {
        if (!"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw com.swp391.common.ApiException.forbidden("Only Admin can view user accounts");
        }
    }

    private UserDto toDto(UserEntity user) {
        return new UserDto(
                user.getId(),
                user.getAccount(),
                user.getRole(),
                user.getGithubUsername(),
                user.getJiraAccountId(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}


package com.swp391.repo;

import com.swp391.repo.dto.AddRepoRequest;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/repos")
@RequiredArgsConstructor
public class GithubRepositoryController {
	private final GithubRepositoryService repoService;

	@GetMapping
	public List<GithubRepositoryEntity> list(@PathVariable Integer groupId, Authentication auth) {
		return repoService.listRepos(groupId, (UserPrincipal) auth.getPrincipal());
	}

	@PostMapping
	public GithubRepositoryEntity add(@PathVariable Integer groupId, @Valid @RequestBody AddRepoRequest req, Authentication auth) {
		return repoService.addRepo(groupId, req.repoUrl(), (UserPrincipal) auth.getPrincipal());
	}
}

package com.swp391.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GithubRepositoryRepository extends JpaRepository<GithubRepositoryEntity, Integer> {
	List<GithubRepositoryEntity> findByGroupId(Integer groupId);
}

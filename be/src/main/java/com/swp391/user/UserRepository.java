package com.swp391.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
	Optional<UserEntity> findByAccount(String account);
	Optional<UserEntity> findByJiraAccountId(String jiraAccountId);
}


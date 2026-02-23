package com.swp391.integration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupIntegrationRepository extends JpaRepository<GroupIntegrationEntity, Integer> {
	Optional<GroupIntegrationEntity> findByGroupId(Integer groupId);
}

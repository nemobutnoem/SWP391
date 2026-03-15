package com.swp391.integration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminIntegrationRepository extends JpaRepository<AdminIntegrationEntity, Integer> {
    Optional<AdminIntegrationEntity> findByConfigKey(String configKey);
}

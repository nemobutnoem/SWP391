package com.swp391.integration;

import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
<<<<<<< HEAD

import java.util.Optional;

public interface GroupIntegrationRepository extends JpaRepository<GroupIntegrationEntity, Integer> {
	Optional<GroupIntegrationEntity> findByGroupId(Integer groupId);
=======
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
import java.util.Optional;

public interface GroupIntegrationRepository extends JpaRepository<GroupIntegrationEntity, Integer> {
    Optional<GroupIntegrationEntity> findByGroupId(Integer groupId);
<<<<<<< HEAD
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}

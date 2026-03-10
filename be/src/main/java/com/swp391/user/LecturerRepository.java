package com.swp391.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LecturerRepository extends JpaRepository<LecturerEntity, Integer> {
<<<<<<< Updated upstream:be/src/main/java/com/swp391/user/LecturerRepository.java
    Optional<LecturerEntity> findByUserId(Integer userId);
=======
	Optional<LecturerEntity> findByUserId(Integer userId);

	boolean existsByEmail(String email);

	boolean existsByEmailAndIdNot(String email, Integer id);
>>>>>>> Stashed changes:be/src/main/java/com/swp391/lecturer/LecturerRepository.java
}

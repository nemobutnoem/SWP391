package com.swp391.semester;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<SemesterEntity, Integer> {
    Optional<SemesterEntity> findByStatusIgnoreCase(String status);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);

    List<SemesterEntity> findByStatusIgnoreCaseAndIdNot(String status, Integer id);
}

package com.swp391.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Integer> {
	List<ProjectEntity> findBySemesterId(Integer semesterId);

	/** Dùng khi CREATE: kiểm tra code đã tồn tại chưa */
	boolean existsByProjectCode(String projectCode);

	/** Dùng khi UPDATE: kiểm tra code đã tồn tại ở project KHÁC không */
	@Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM ProjectEntity p WHERE p.projectCode = :code AND p.id <> :id")
	boolean existsByCodeAndNotId(@Param("code") String code, @Param("id") Integer id);
}

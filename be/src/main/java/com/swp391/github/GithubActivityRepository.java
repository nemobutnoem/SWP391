package com.swp391.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface GithubActivityRepository extends JpaRepository<GithubActivityEntity, Integer> {
	List<GithubActivityEntity> findByGroupId(Integer groupId);

	@Query("select a.githubUsername, coalesce(sum(a.pushedCommitCount), 0) from GithubActivityEntity a " +
			"where a.groupId = :groupId and (:from is null or a.occurredAt >= :from) and (:to is null or a.occurredAt <= :to) " +
			"group by a.githubUsername")
	List<Object[]> sumCommitsByUser(@Param("groupId") Integer groupId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}

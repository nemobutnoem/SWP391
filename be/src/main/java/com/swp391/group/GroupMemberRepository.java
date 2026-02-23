package com.swp391.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMemberEntity, Integer> {
	List<GroupMemberEntity> findByStudentId(Integer studentId);
	List<GroupMemberEntity> findByGroupId(Integer groupId);
	Optional<GroupMemberEntity> findByGroupIdAndStudentId(Integer groupId, Integer studentId);
}

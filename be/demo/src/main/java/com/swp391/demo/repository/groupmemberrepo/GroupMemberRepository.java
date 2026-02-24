package com.swp391.demo.repository.groupmemberrepo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.swp391.demo.entity.groupmember.GroupMember;

public interface GroupMemberRepository extends JpaRepository<GroupMember,Long> {

}

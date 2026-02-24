package com.swp391.demo.service.groupmember;

import java.util.List;

import com.swp391.demo.entity.groupmember.GroupMember;

public interface GroupMemberService {
List<GroupMember> getAllMembers();
GroupMember getMemberById(Long id);
GroupMember createMember(GroupMember groupMember);
GroupMember updateMember(Long id, GroupMember groupMember);
void deleteMember(Long id);
}

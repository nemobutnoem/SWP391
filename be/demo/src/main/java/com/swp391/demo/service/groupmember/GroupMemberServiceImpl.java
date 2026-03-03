package com.swp391.demo.service.groupmember;

import java.util.List;

import org.springframework.stereotype.Service;

import com.swp391.demo.entity.groupmember.GroupMember;
import com.swp391.demo.repository.groupmemberrepo.GroupMemberRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupMemberServiceImpl implements GroupMemberService {
    private final GroupMemberRepository groupMemberRepository;

    @Override
    public List<GroupMember> getAllMembers() {
        return groupMemberRepository.findAll();
    }

    @Override
    public GroupMember getMemberById(Long id) {
        return groupMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }

    @Override
    public GroupMember createMember(GroupMember groupMember) {
        return groupMemberRepository.save(groupMember);
    }

    @Override
    public GroupMember updateMember(Long id, GroupMember groupMember) {
      GroupMember existingMember = groupMemberRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Member not found with id " + id));

    if(groupMember.getRoleInGroup() != null){
        existingMember.setRoleInGroup(groupMember.getRoleInGroup());
    }

    if(groupMember.getStatus() != null){
        existingMember.setStatus(groupMember.getStatus());
    }

    existingMember.setUpdatedAt(LocalDateTime.now());

    return groupMemberRepository.save(existingMember);
    }

    @Override
    public void deleteMember(Long id) {
        if (!groupMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("Member not found with id: " + id);
        }

        groupMemberRepository.deleteById(id);
    }

}

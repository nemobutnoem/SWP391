package com.swp391.demo.service.groupmember;

import java.util.List;

import org.springframework.stereotype.Service;

import com.swp391.demo.entity.groupmember.GroupMember;
import com.swp391.demo.repository.groupmemberrepo.GroupMemberRepository;
@Service
public class GroupMemberServiceImpl implements GroupMemberService {
    private GroupMemberRepository groupMemberRepository;

    @Override
    public List<GroupMember> getAllMembers() {
       return groupMemberRepository.findAll();
    }

    @Override
    public GroupMember getMemberById(Long id) {
        return groupMemberRepository.findById(id)
        .orElseThrow(()-> new RuntimeException("Member not found") );
    }

    @Override
    public GroupMember createMember(GroupMember groupMember) {
      return groupMemberRepository.save(groupMember);
    }

    @Override
    public GroupMember updateMember(Long id, GroupMember groupMember) {
        if(groupMember.getId()==null){
            throw new IllegalArgumentException("Member ID is required for update");
        }
        if(!groupMemberRepository.existsById(groupMember.getId())){
            throw new IllegalArgumentException("Member not found with id"+groupMember.getId());
        }
        GroupMember updateMember = groupMemberRepository.save(groupMember);
        return updateMember;
    }

    @Override
    public void deleteMember(Long id) {
    if (!groupMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("Member not found with id: " + id);
        }
        
        groupMemberRepository.deleteById(id);
    }

}

package com.swp391.group;

import com.swp391.common.ApiException;
import com.swp391.group.dto.GroupMemberDto;
import com.swp391.student.StudentRepository;
import com.swp391.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupMemberService {
    private final GroupMemberRepository memberRepository;
    private final StudentRepository studentRepository;
    private final StudentGroupRepository groupRepository;
    private final UserRepository userRepository;

    public List<GroupMemberDto> listGroupMembers(Integer groupId) {
        return memberRepository.findByGroupId(groupId).stream()
                .map(m -> {
                    var student = studentRepository.findById(m.getStudentId()).orElse(null);
                    Integer userId = student == null ? null : student.getUserId();
                    var user = userId == null ? null : userRepository.findById(userId).orElse(null);
                    return new GroupMemberDto(
                            m.getGroupId(),
                            m.getStudentId(),
                            userId,
                            student == null ? null : student.getFullName(),
                            student == null ? null : student.getEmail(),
                            user == null ? null : user.getAccount(),
                            user == null ? null : user.getJiraAccountId(),
                            m.getRoleInGroup()
                    );
                })
                .sorted(Comparator.comparing((GroupMemberDto d) -> d.fullName() == null ? "" : d.fullName()))
                .toList();
    }

    @Transactional
    public GroupMemberEntity addMember(Integer groupId, Integer studentId, String roleInGroup) {
        var group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Group not found with id: " + groupId));

        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found with id: " + studentId));

        // Business Rule: Member must belong to the same class as the group
        if (student.getClassId() != null && !student.getClassId().equals(group.getClassId())) {
            throw ApiException.badRequest("Student " + student.getFullName() + " does not belong to the class of this group");
        }
    if (memberRepository.existsByStudentId(studentId)) {
        throw ApiException.badRequest("Student already belongs to another group");
    }

        GroupMemberEntity member = new GroupMemberEntity();
        member.setGroupId(groupId);
        member.setStudentId(studentId);
        member.setRoleInGroup(roleInGroup != null ? roleInGroup : "Member");
        member.setStatus("Active");
        member.setJoinedAt(LocalDateTime.now());

        try {
            GroupMemberEntity saved = memberRepository.save(member);
            if ("Leader".equalsIgnoreCase(roleInGroup)) {
                syncLeader(groupId, studentId);
            }
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw ApiException.badRequest("Student is already a member of this group");
        }
    }

    @Transactional
    public GroupMemberEntity updateRole(Integer memberId, String newRole) {
        GroupMemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.notFound("Group member not found"));

        String oldRole = member.getRoleInGroup();
        member.setRoleInGroup(newRole);
        GroupMemberEntity saved = memberRepository.save(member);

        if ("Leader".equalsIgnoreCase(newRole)) {
            syncLeader(member.getGroupId(), member.getStudentId());
        } else if ("Leader".equalsIgnoreCase(oldRole) && !"Leader".equalsIgnoreCase(newRole)) {
            var group = groupRepository.findById(member.getGroupId()).orElse(null);
            if (group != null && member.getStudentId().equals(group.getLeaderStudentId())) {
                group.setLeaderStudentId(null);
                groupRepository.save(group);
            }
            syncUserRole(member.getStudentId());
        }

        return saved;
    }

    @Transactional
    public void removeMember(Integer groupId, Integer memberId) {
        GroupMemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.notFound("Group member not found"));

        if (!member.getGroupId().equals(groupId)) {
            throw ApiException.badRequest("Member does not belong to this group");
        }

        // If removing the leader, reset leader_student_id in group
        if ("Leader".equalsIgnoreCase(member.getRoleInGroup())) {
            var group = groupRepository.findById(groupId).orElse(null);
            if (group != null) {
                group.setLeaderStudentId(null);
                groupRepository.save(group);
            }
        }

        memberRepository.delete(member);
    }

    private void syncLeader(Integer groupId, Integer leaderStudentId) {
        var group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Group not found"));

        // Rule: Only one leader. Find others and demote.
        var members = memberRepository.findByGroupId(groupId);
        for (var m : members) {
            if ("Leader".equalsIgnoreCase(m.getRoleInGroup()) && !m.getStudentId().equals(leaderStudentId)) {
                m.setRoleInGroup("Member");
                memberRepository.save(m);
                // Demote old leader's user role back to TEAM_MEMBER (if not leader in another group)
                syncUserRole(m.getStudentId());
            }
        }

        group.setLeaderStudentId(leaderStudentId);
        groupRepository.save(group);

        // Promote new leader's user role to TEAM_LEAD
        syncUserRole(leaderStudentId);
    }

    /**
     * Sync users.role based on whether the student is a LEADER in any group.
     * LEADER in any group → TEAM_LEAD, otherwise → TEAM_MEMBER.
     */
    private void syncUserRole(Integer studentId) {
        var student = studentRepository.findById(studentId).orElse(null);
        if (student == null || student.getUserId() == null) return;

        var user = userRepository.findById(student.getUserId()).orElse(null);
        if (user == null) return;

        // Don't touch ADMIN or LECTURER roles
        if ("ADMIN".equalsIgnoreCase(user.getRole()) || "LECTURER".equalsIgnoreCase(user.getRole())) return;

        boolean isLeaderAnywhere = memberRepository.findByStudentId(studentId).stream()
                .anyMatch(m -> "Leader".equalsIgnoreCase(m.getRoleInGroup()));

        user.setRole(isLeaderAnywhere ? "TEAM_LEAD" : "TEAM_MEMBER");
        userRepository.save(user);
    }
}

package com.swp391.group;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/allocation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAllocationController {
    private final StudentGroupRepository groupRepository;

    @GetMapping("/groups")
    public List<StudentGroupEntity> listAllGroups() {
        return groupRepository.findAll();
    }

    @PostMapping("/groups/{groupId}/project/{projectId}")
    public StudentGroupEntity assignProject(@PathVariable Integer groupId, @PathVariable Integer projectId) {
        StudentGroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        group.setProjectId(projectId);
        return groupRepository.save(group);
    }

    @PostMapping("/groups/{groupId}/lecturer/{lecturerId}")
    public StudentGroupEntity assignLecturer(@PathVariable Integer groupId, @PathVariable Integer lecturerId) {
        StudentGroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        group.setLecturerId(lecturerId);
        return groupRepository.save(group);
    }

    @PostMapping("/groups")
    public StudentGroupEntity createGroup(@RequestBody StudentGroupEntity group) {
        return groupRepository.save(group);
    }

    @PutMapping("/groups/{groupId}")
    public StudentGroupEntity updateGroup(@PathVariable Integer groupId, @RequestBody StudentGroupEntity group) {
        StudentGroupEntity existing = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        existing.setGroupName(group.getGroupName());
        existing.setGroupCode(group.getGroupCode());
        existing.setDescription(group.getDescription());
        existing.setStatus(group.getStatus());
        existing.setSemesterId(group.getSemesterId());
        existing.setClassId(group.getClassId());
        existing.setLeaderStudentId(group.getLeaderStudentId());
        return groupRepository.save(existing);
    }

    @DeleteMapping("/groups/{groupId}")
    public void deleteGroup(@PathVariable Integer groupId) {
        groupRepository.deleteById(groupId);
    }
}

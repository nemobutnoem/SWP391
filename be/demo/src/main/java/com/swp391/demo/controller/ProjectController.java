package com.swp391.demo.controller;

import com.swp391.demo.entity.*;
import com.swp391.demo.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // --- ADMIN ---
    @PostMapping("/groups")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentGroup> createGroup(@RequestBody StudentGroup group) {
        return ResponseEntity.ok(projectService.createGroup(group));
    }

    @GetMapping("/groups")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentGroup>> getAllGroups() {
        return ResponseEntity.ok(projectService.getAllGroups());
    }

    @PutMapping("/groups/{groupId}/assign-lecturer/{lectureId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentGroup> assignLecturer(@PathVariable Long groupId, @PathVariable Long lectureId) {
        return ResponseEntity.ok(projectService.assignLecturerToGroup(groupId, lectureId));
    }

    @PostMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectConfig> configureIntegration(@RequestBody ProjectConfig config) {
        return ResponseEntity.ok(projectService.configureIntegration(config));
    }

    // --- LECTURER ---
    @GetMapping("/lecturer/{lectureId}/groups")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<StudentGroup>> getMyGroups(@PathVariable Long lectureId) {
        return ResponseEntity.ok(projectService.getGroupsByLecturer(lectureId));
    }

    @GetMapping("/groups/{groupId}/tasks")
    @PreAuthorize("hasAnyRole('LECTURER', 'LEADER', 'MEMBER')")
    public ResponseEntity<List<Task>> getGroupTasks(@PathVariable Long groupId) {
        return ResponseEntity.ok(projectService.getTasksByGroup(groupId));
    }

    @GetMapping("/groups/{groupId}/requirements")
    @PreAuthorize("hasAnyRole('LECTURER', 'LEADER')")
    public ResponseEntity<List<Requirement>> getGroupRequirements(@PathVariable Long groupId) {
        return ResponseEntity.ok(projectService.getRequirementsByGroup(groupId));
    }

    // --- TEAM LEADER ---
    @PostMapping("/tasks")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        return ResponseEntity.ok(projectService.createTask(task));
    }

    @PutMapping("/tasks/{taskId}/assign/{memberId}")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<Task> assignTask(@PathVariable Long taskId, @PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.assignTask(taskId, memberId));
    }

    @PostMapping("/requirements")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<Requirement> createRequirement(@RequestBody Requirement requirement) {
        return ResponseEntity.ok(projectService.createRequirement(requirement));
    }

    // --- TEAM MEMBER ---
    @GetMapping("/member/{memberId}/tasks")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<Task>> getMyTasks(@PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.getMyTasks(memberId));
    }

    @PatchMapping("/tasks/{taskId}/status")
    @PreAuthorize("hasAnyRole('MEMBER', 'LEADER', 'LECTURER')")
    public ResponseEntity<Task> updateTaskStatus(@PathVariable Long taskId, @RequestParam String status) {
        return ResponseEntity.ok(projectService.updateTaskStatus(taskId, status));
    }

    // --- REPORTS & STATISTICS ---
    @GetMapping("/groups/{groupId}/report")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<Object> getProjectReport(@PathVariable Long groupId) {
        return ResponseEntity.ok(projectService.getProjectReport(groupId));
    }

    @GetMapping("/groups/{groupId}/commits")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<Object> getCommitStatistics(@PathVariable Long groupId) {
        return ResponseEntity.ok(projectService.getCommitStatistics(groupId));
    }

    @GetMapping("/groups/{groupId}/team-summary")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<Object> getTeamCommitSummary(@PathVariable Long groupId) {
        return ResponseEntity.ok(projectService.getTeamCommitSummary(groupId));
    }

    @GetMapping("/member/{memberId}/stats")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<Object> getMemberStatistics(@PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.getMemberStatistics(memberId));
    }
}

package com.swp391.demo.service;

import com.swp391.demo.entity.*;
import com.swp391.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final StudentGroupRepository groupRepository;
    private final TaskRepository taskRepository;
    private final RequirementRepository requirementRepository;
    private final ProjectConfigRepository configRepository;

    @Override
    public StudentGroup createGroup(StudentGroup group) {
        return groupRepository.save(group);
    }

    @Override
    public List<StudentGroup> getAllGroups() {
        return groupRepository.findAll();
    }

    @Override
    public StudentGroup assignLecturerToGroup(Long groupId, Long lectureId) {
        StudentGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        group.setLectureId(lectureId);
        return groupRepository.save(group);
    }

    @Override
    public ProjectConfig configureIntegration(ProjectConfig config) {
        return configRepository.save(config);
    }

    @Override
    public List<StudentGroup> getGroupsByLecturer(Long lectureId) {
        return groupRepository.findByLectureId(lectureId);
    }

    @Override
    public List<Task> getTasksByGroup(Long groupId) {
        return taskRepository.findByGroupId(groupId);
    }

    @Override
    public List<Requirement> getRequirementsByGroup(Long groupId) {
        return requirementRepository.findByGroupId(groupId);
    }

    @Override
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    @Override
    public Task assignTask(Long taskId, Long memberId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setAssignedTo(memberId);
        return taskRepository.save(task);
    }

    @Override
    public Requirement createRequirement(Requirement requirement) {
        return requirementRepository.save(requirement);
    }

    @Override
    public List<Task> getMyTasks(Long memberId) {
        return taskRepository.findByAssignedTo(memberId);
    }

    @Override
    public Task updateTaskStatus(Long taskId, String status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        return taskRepository.save(task);
    }

    @Override
    public Object getProjectReport(Long groupId) {
        return "Báo cáo tiến độ cho nhóm " + groupId + ": 80% hoàn thành (Dữ liệu mẫu)";
    }

    @Override
    public Object getCommitStatistics(Long groupId) {
        return "Thống kê GitHub commit cho nhóm " + groupId + ": 45 commits (Dữ liệu mẫu)";
    }

    @Override
    public Object getTeamCommitSummary(Long groupId) {
        return "Tóm tắt commit của nhóm " + groupId + ": Leader (20), Member A (15), Member B (10)";
    }

    @Override
    public Object getMemberStatistics(Long memberId) {
        return "Thống kê cá nhân cho member " + memberId + ": 5 tasks completed, 12 commits (Dữ liệu mẫu)";
    }
}

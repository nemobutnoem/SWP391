package com.swp391.demo.service;

import com.swp391.demo.entity.*;
import java.util.List;

public interface ProjectService {
    // Admin features
    StudentGroup createGroup(StudentGroup group);

    List<StudentGroup> getAllGroups();

    StudentGroup assignLecturerToGroup(Long groupId, Long lectureId);

    ProjectConfig configureIntegration(ProjectConfig config);

    // Lecturer features
    List<StudentGroup> getGroupsByLecturer(Long lectureId);

    List<Task> getTasksByGroup(Long groupId);

    List<Requirement> getRequirementsByGroup(Long groupId);

    // Team Leader features
    Task createTask(Task task);

    Task assignTask(Long taskId, Long memberId);

    Requirement createRequirement(Requirement requirement);

    // Team Member features
    List<Task> getMyTasks(Long memberId);

    Task updateTaskStatus(Long taskId, String status);

    // Reports and Statistics
    Object getProjectReport(Long groupId);

    Object getCommitStatistics(Long groupId);

    Object getTeamCommitSummary(Long groupId);

    Object getMemberStatistics(Long memberId);
}

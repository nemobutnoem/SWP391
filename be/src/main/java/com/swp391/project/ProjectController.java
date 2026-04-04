package com.swp391.project;

import com.swp391.group.StudentGroupEntity;
import com.swp391.group.StudentGroupRepository;
import com.swp391.clazz.ClassRepository;
import com.swp391.semester.SemesterRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final StudentGroupRepository groupRepository;
    private final SemesterRepository semesterRepository;
    private final ClassRepository classRepository;

    private void assertSemesterNotCompleted(Integer semesterId) {
        if (semesterId == null) return;
        var sem = semesterRepository.findById(semesterId).orElse(null);
        if (sem != null && "COMPLETED".equalsIgnoreCase(sem.getStatus())) {
            throw new IllegalStateException("Semester is completed. Topics are locked.");
        }
    }

    private boolean isCapstoneRunning(Integer semesterId) {
        if (semesterId == null) return false;
        LocalDate today = LocalDate.now();
        return classRepository.findBySemesterId(semesterId).stream()
                .filter(c -> c.getClassType() != null && "CAPSTONE".equalsIgnoreCase(c.getClassType()))
                .anyMatch(c -> {
                    var start = c.getStartDate();
                    var end = c.getEndDate();
                    if (start != null && end != null) {
                        return (!today.isBefore(start) && !today.isAfter(end));
                    }
                    if (start != null) {
                        return !today.isBefore(start);
                    }
                    return false;
                });
    }

    private void assertCreateAllowed(Integer semesterId, String blockType) {
        if (semesterId == null) {
            throw new IllegalStateException("semester_id is required to create a topic");
        }

        var sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));

        // Semester must have at least one class before topics can be created
        var semClasses = classRepository.findBySemesterId(semesterId);
        if (semClasses.isEmpty()) {
            throw new IllegalStateException("Cannot create topics: semester '" + sem.getName()
                    + "' has no classes yet. Create classes first.");
        }

        var status = sem.getStatus() == null ? "" : sem.getStatus();

        if ("COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalStateException("Semester is completed. Topics are locked.");
        }

        if ("UPCOMING".equalsIgnoreCase(status)) {
            // Upcoming semesters: only MAIN topics allowed (matching class restriction)
            if ("CAPSTONE".equalsIgnoreCase(blockType)) {
                throw new IllegalStateException("Cannot create Capstone (3w) topics for an Upcoming semester. Activate the semester first.");
            }
            return;
        }

        if ("ACTIVE".equalsIgnoreCase(status)) {
            if (isCapstoneRunning(semesterId)) {
                throw new IllegalStateException("Capstone is in progress. You can only create topics for upcoming semesters.");
            }
            if (blockType == null || !"CAPSTONE".equalsIgnoreCase(blockType)) {
                throw new IllegalStateException("During MAIN (10-week) phase, you can only create CAPSTONE (3-week) topics for the current semester.");
            }
            return;
        }

        throw new IllegalStateException("You can only create topics for UPCOMING semesters.");
    }

    // ================= DTO REQUEST =================
    public record UpsertProjectRequest(

            @NotBlank(message = "Project name is required") @Size(min = 3, max = 100, message = "Project name must be between 3 and 100 characters") String name,

            @NotBlank(message = "Project code is required") @Size(min = 2, max = 20, message = "Project code must be between 2 and 20 characters") @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Project code must contain only uppercase letters, numbers, _ or -") String code,

            @Size(max = 500, message = "Description must not exceed 500 characters") String description,

            @jakarta.validation.constraints.Positive(message = "semester_id must be a positive number")
            @com.fasterxml.jackson.annotation.JsonProperty("semester_id") Integer semesterId,

            @Pattern(regexp = "MAIN|CAPSTONE", message = "block_type must be MAIN or CAPSTONE")
            @com.fasterxml.jackson.annotation.JsonProperty("block_type") String blockType,

            @Pattern(regexp = "ACTIVE|INACTIVE|ARCHIVED", message = "Status must be ACTIVE, INACTIVE, or ARCHIVED") String status) {
    }

    // ================= GET ALL PROJECT =================
    @GetMapping
    public List<ProjectEntity> list() {
        return projectRepository.findAll();
    }

    // ================= CREATE PROJECT =================
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectEntity create(@Valid @RequestBody UpsertProjectRequest req) {

        if (projectRepository.existsByProjectCode(req.code())) {
            throw new IllegalArgumentException("Project code already exists");
        }

        ProjectEntity project = new ProjectEntity();

        var semesterId = req.semesterId() != null ? req.semesterId() : 1;
        var blockType = req.blockType() != null ? req.blockType() : "MAIN";
        assertCreateAllowed(semesterId, blockType);

        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());
		project.setSemesterId(semesterId); // default semester
		project.setBlockType(blockType);
        project.setStatus(req.status() != null ? req.status() : "ACTIVE");

        return projectRepository.save(project);
    }

    // ================= UPDATE PROJECT =================
    @PutMapping("/{id}")
    public ProjectEntity update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpsertProjectRequest req) {

        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        var targetSemesterId = req.semesterId() != null ? req.semesterId() : project.getSemesterId();
        assertSemesterNotCompleted(targetSemesterId);

        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());

        if (req.semesterId() != null) {
            project.setSemesterId(req.semesterId());
        }
        if (req.blockType() != null) {
            project.setBlockType(req.blockType());
        }

        if (req.status() != null) {
            project.setStatus(req.status());
        }

        return projectRepository.save(project);
    }

    // ================= ARCHIVE PROJECT =================
    @PatchMapping("/{id}/archive")
    public ProjectEntity archive(@PathVariable("id") Integer id) {

        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        assertSemesterNotCompleted(project.getSemesterId());

        project.setStatus("ARCHIVED");

        return projectRepository.save(project);
    }

    // ================= CHECK IF TOPIC IS IN USE =================
    @GetMapping("/{id}/usage")
    public Map<String, Object> checkUsage(@PathVariable("id") Integer id) {
        projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        List<String> groupNames = groupRepository.findByProjectId(id).stream()
                .map(g -> g.getGroupName() != null ? g.getGroupName() : "Group " + g.getId())
                .toList();
        return Map.of("inUse", !groupNames.isEmpty(), "groups", groupNames);
    }

    // ================= DELETE PROJECT =================
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Integer id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        assertSemesterNotCompleted(project.getSemesterId());
        // Unlink groups that reference this topic
        List<StudentGroupEntity> groups = groupRepository.findByProjectId(id);
        for (var g : groups) {
            g.setProjectId(null);
            groupRepository.save(g);
        }
        projectRepository.delete(project);
    }
}
package com.swp391.project;

import com.swp391.group.StudentGroupEntity;
import com.swp391.group.StudentGroupRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final StudentGroupRepository groupRepository;

    // ================= DTO REQUEST =================
    public record UpsertProjectRequest(

            @NotBlank(message = "Project name is required") @Size(min = 3, max = 100, message = "Project name must be between 3 and 100 characters") String name,

            @NotBlank(message = "Project code is required") @Size(min = 2, max = 20, message = "Project code must be between 2 and 20 characters") @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Project code must contain only uppercase letters, numbers, _ or -") String code,

            @Size(max = 500, message = "Description must not exceed 500 characters") String description,

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

        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());
        project.setSemesterId(1); // default semester
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

        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());

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
        // Unlink groups that reference this topic
        List<StudentGroupEntity> groups = groupRepository.findByProjectId(id);
        for (var g : groups) {
            g.setProjectId(null);
            groupRepository.save(g);
        }
        projectRepository.delete(project);
    }
}
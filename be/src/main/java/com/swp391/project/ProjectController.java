package com.swp391.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    public record UpsertProjectRequest(
            String name,
            String description,
            String status) {
    }

    @GetMapping
    public List<ProjectEntity> list() {
        return projectRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectEntity create(@Valid @RequestBody UpsertProjectRequest req) {
        ProjectEntity project = new ProjectEntity();
        project.setProjectName(req.name());
        project.setDescription(req.description());
        project.setSemesterId(1); // Default semester to prevent NULL constraint
        project.setStatus(req.status() != null ? req.status() : "Active");
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public ProjectEntity update(@PathVariable Integer id, @Valid @RequestBody UpsertProjectRequest req) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        project.setProjectName(req.name());
        project.setDescription(req.description());
        if (req.status() != null) {
            project.setStatus(req.status());
        }
        return projectRepository.save(project);
    }

    @PatchMapping("/{id}/archive")
    public ProjectEntity archive(@PathVariable Integer id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        project.setStatus("ARCHIVED");
        return projectRepository.save(project);
    }
}

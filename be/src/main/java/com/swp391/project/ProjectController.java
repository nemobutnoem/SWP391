package com.swp391.project;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectRepository projectRepository;

    @GetMapping
    public List<ProjectEntity> list() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public ProjectEntity get(@PathVariable Integer id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @PostMapping
    public ProjectEntity create(@RequestBody ProjectEntity project) {
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public ProjectEntity update(@PathVariable Integer id, @RequestBody ProjectEntity project) {
        ProjectEntity existing = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        existing.setProjectCode(project.getProjectCode());
        existing.setProjectName(project.getProjectName());
        existing.setDescription(project.getDescription());
        existing.setStatus(project.getStatus());
        existing.setSemesterId(project.getSemesterId());
        return projectRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        projectRepository.deleteById(id);
    }
}

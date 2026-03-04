package com.swp391.compat;

import com.swp391.project.ProjectEntity;
import com.swp391.project.ProjectRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CompatProjectController {

    private final ProjectRepository projectRepository;

    public CompatProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping("/projects")
    public List<ProjectEntity> list(Authentication auth) {
        return projectRepository.findAll();
    }
}

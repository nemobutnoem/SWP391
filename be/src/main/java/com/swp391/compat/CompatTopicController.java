package com.swp391.compat;

import com.swp391.project.ProjectEntity;
import com.swp391.project.ProjectRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CompatTopicController {

    private final ProjectRepository projectRepository;

    public CompatTopicController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    // FE "topics" concept maps to the projects table
    @GetMapping("/topics")
    public List<ProjectEntity> list(Authentication auth) {
        return projectRepository.findAll();
    }
}

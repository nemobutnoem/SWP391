package com.swp391.project;

<<<<<<< Updated upstream
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
=======
import com.swp391.group.StudentGroupRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
>>>>>>> Stashed changes

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectRepository projectRepository;
    private final StudentGroupRepository groupRepository;

<<<<<<< Updated upstream
=======
    /**
     * Project code rules (real-world standard):
     * - Uppercase letters, digits, hyphens only
     * - Starts with 1–4 uppercase letters (subject/area prefix)
     * - Optionally followed by groups of 1–6 alphanumeric chars separated by
     * hyphens
     * - Total length: 2–20 characters
     * - Examples: SE1234, AI-H-01, SWP-2025-001, IOT-A-002
     */
    public record UpsertProjectRequest(

            @NotBlank(message = "Project name is required") @Size(max = 255, message = "Project name must not exceed 255 characters") String name,

            @NotBlank(message = "Project code is required") @Pattern(regexp = "^[A-Z]{1,4}(-[A-Z0-9]{1,6}){0,3}$|^[A-Z]{2,4}[0-9]{2,6}$", message = "Invalid project code. Use uppercase letters & digits, optionally separated by hyphens. Examples: SE1234, AI-H-01, SWP-2025-001") @Size(max = 20, message = "Project code must not exceed 20 characters") String code,

            @Size(max = 1000, message = "Description must not exceed 1000 characters") String description,

            String status) {
    }

    @GetMapping("/{id}")
    public ProjectEntity getById(@PathVariable("id") Integer id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectEntity create(@RequestBody ProjectEntity project) {
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        projectRepository.deleteById(id);
=======
    public ResponseEntity<?> create(@Valid @RequestBody UpsertProjectRequest req) {
        // Kiểm tra code trùng
        if (projectRepository.existsByProjectCode(req.code())) {
            Map<String, String> err = new LinkedHashMap<>();
            err.put("code", "Project code '" + req.code() + "' already exists. Please use a different code.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
        ProjectEntity project = new ProjectEntity();
        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());
        project.setSemesterId(1); // Default semester to prevent NULL constraint
        project.setStatus(req.status() != null ? req.status() : "ACTIVE");
        return ResponseEntity.status(HttpStatus.CREATED).body(projectRepository.save(project));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Integer id, @Valid @RequestBody UpsertProjectRequest req) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Kiểm tra code trùng với project KHÁC (không phải chính nó)
        if (projectRepository.existsByCodeAndNotId(req.code(), id)) {
            Map<String, String> err = new LinkedHashMap<>();
            err.put("code", "Project code '" + req.code() + "' already exists. Please use a different code.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }

        project.setProjectName(req.name());
        project.setProjectCode(req.code());
        project.setDescription(req.description());
        if (req.status() != null) {
            project.setStatus(req.status());
        }
        return ResponseEntity.ok(projectRepository.save(project));
    }

    @PatchMapping("/{id}/archive")
    public ProjectEntity archive(@PathVariable("id") Integer id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        project.setStatus("ARCHIVED");
        return projectRepository.save(project);
>>>>>>> Stashed changes
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Integer id) {
        if (!projectRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Kiểm tra xem đề tài đã có nhóm đăng ký chưa
        if (groupRepository.existsByProjectId(id)) {
            Map<String, String> err = new LinkedHashMap<>();
            err.put("error",
                    "Cannot delete topic because it is assigned to one or more groups. Please ARCHIVE it instead.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }

        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

package com.swp391.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
@RequiredArgsConstructor
public class LecturerController {
    private final LecturerRepository lecturerRepository;

    @GetMapping
    public List<LecturerEntity> list() {
        return lecturerRepository.findAll();
    }

    @GetMapping("/{id}")
    public LecturerEntity get(@PathVariable Integer id) {
        return lecturerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lecturer not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public LecturerEntity create(@RequestBody LecturerEntity lecturer) {
        return lecturerRepository.save(lecturer);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LecturerEntity update(@PathVariable Integer id, @RequestBody LecturerEntity lecturer) {
        LecturerEntity existing = lecturerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lecturer not found"));
        existing.setFullName(lecturer.getFullName());
        existing.setEmail(lecturer.getEmail());
        existing.setStatus(lecturer.getStatus());
        // user_id typically shouldn't change
        return lecturerRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        lecturerRepository.deleteById(id);
    }
}

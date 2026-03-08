package com.swp391.group;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassRepository classRepository;

    @GetMapping
    public List<ClassEntity> list() {
        return classRepository.findAll();
    }

    @GetMapping("/{id}")
    public ClassEntity get(@PathVariable Integer id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ClassEntity create(@RequestBody ClassEntity clazz) {
        return classRepository.save(clazz);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ClassEntity update(@PathVariable Integer id, @RequestBody ClassEntity clazz) {
        ClassEntity existing = classRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
        existing.setClassCode(clazz.getClassCode());
        existing.setClassName(clazz.getClassName());
        existing.setMajor(clazz.getMajor());
        existing.setIntakeYear(clazz.getIntakeYear());
        existing.setDepartment(clazz.getDepartment());
        existing.setStatus(clazz.getStatus());
        existing.setLecturerId(clazz.getLecturerId());
        return classRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        classRepository.deleteById(id);
    }
}

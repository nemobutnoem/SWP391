package com.swp391.semester;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {
    private final SemesterRepository semesterRepository;

    @GetMapping
    public List<SemesterEntity> list() {
        return semesterRepository.findAll();
    }

    @GetMapping("/{id}")
<<<<<<< Updated upstream
    public SemesterEntity get(@PathVariable Integer id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
=======
    public SemesterEntity getById(@PathVariable("id") Integer id) {
        return semesterService.getById(id);
>>>>>>> Stashed changes
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SemesterEntity create(@RequestBody SemesterEntity semester) {
        return semesterRepository.save(semester);
    }

    @PutMapping("/{id}")
<<<<<<< Updated upstream
    @PreAuthorize("hasRole('ADMIN')")
    public SemesterEntity update(@PathVariable Integer id, @RequestBody SemesterEntity semester) {
        SemesterEntity existing = semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        existing.setCode(semester.getCode());
        existing.setName(semester.getName());
        existing.setStartDate(semester.getStartDate());
        existing.setEndDate(semester.getEndDate());
        existing.setStatus(semester.getStatus());
        return semesterRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        semesterRepository.deleteById(id);
=======
    public SemesterEntity update(@PathVariable("id") Integer id, @Valid @RequestBody UpsertSemesterRequest req) {
        return semesterService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Integer id) {
        semesterService.delete(id);
>>>>>>> Stashed changes
    }
}

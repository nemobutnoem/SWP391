package com.swp391.semester;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {
    private final SemesterService semesterService;

    @GetMapping
    public List<SemesterEntity> list() {
        return semesterService.listAll();
    }

    @GetMapping("/active")
    public SemesterEntity getActive() {
        return semesterService.getActiveSemester();
    }

    @GetMapping("/{id}")
    public SemesterEntity getById(@PathVariable Integer id) {
        return semesterService.getById(id);
    }
}

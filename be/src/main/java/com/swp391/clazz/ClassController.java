package com.swp391.clazz;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassService classService;

    @GetMapping
    public List<ClassEntity> list(@RequestParam(name = "semester_id", required = false) Integer semesterId) {
        if (semesterId != null) {
            return classService.findBySemester(semesterId);
        }
        return classService.listAll();
    }

    @GetMapping("/{id}")
    public ClassEntity getById(@PathVariable Integer id) {
        return classService.getById(id);
    }
}

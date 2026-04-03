package com.swp391.clazz;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassService classService;

    public record UpsertClassRequest(
            @JsonProperty("class_code") @NotBlank String classCode,
            @JsonProperty("class_name") @NotBlank(message = "Class name is required") String className,
            @JsonProperty("semester_id") Integer semesterId,
            String major,
            @JsonProperty("intake_year") Integer intakeYear,
            String department,
            @JsonProperty("lecturer_id") Integer lecturerId,
            @JsonProperty("class_type") String classType,
            @JsonProperty("prerequisite_class_id") Integer prerequisiteClassId,
            @JsonProperty("start_date") java.time.LocalDate startDate,
            @JsonProperty("end_date") java.time.LocalDate endDate,
            String status) {
    }

    @GetMapping
    public List<ClassEntity> list(@RequestParam(name = "semester_id", required = false) Integer semesterId) {
        if (semesterId != null) {
            return classService.findBySemester(semesterId);
        }
        return classService.listAll();
    }

    @GetMapping("/{id}")
    public ClassEntity getById(@PathVariable("id") Integer id) {
        return classService.getById(id);
    }

    @PostMapping
    public ClassEntity create(@Valid @RequestBody UpsertClassRequest req) {
        return classService.create(req);
    }

    @PutMapping("/{id}")
    public ClassEntity update(@PathVariable("id") Integer id, @Valid @RequestBody UpsertClassRequest req) {
        return classService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Integer id) {
        classService.delete(id);
    }
}

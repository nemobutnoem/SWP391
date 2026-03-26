package com.swp391.semester;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {
    private final SemesterService semesterService;

    public record UpsertSemesterRequest(
            @NotBlank String code,
            @NotBlank String name,
            @NotNull(message = "Start date is required")
            @JsonProperty("start_date") LocalDate startDate,
            @NotNull(message = "End date is required")
            @JsonProperty("end_date") LocalDate endDate,
            String status) {
    }

    @GetMapping
    public List<SemesterEntity> list() {
        return semesterService.listAll();
    }

    @GetMapping("/active")
    public SemesterEntity getActive() {
        return semesterService.getActiveSemester();
    }

    @GetMapping("/{id}")
    public SemesterEntity getById(@PathVariable("id") Integer id) {
        return semesterService.getById(id);
    }

    @PostMapping
    public SemesterEntity create(@Valid @RequestBody UpsertSemesterRequest req) {
        return semesterService.create(req);
    }

    @PutMapping("/{id}")
    public SemesterEntity update(@PathVariable("id") Integer id, @Valid @RequestBody UpsertSemesterRequest req) {
        return semesterService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Integer id) {
        semesterService.delete(id);
    }
}

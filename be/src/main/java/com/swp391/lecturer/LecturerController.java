package com.swp391.lecturer;

import com.swp391.lecturer.dto.CreateLecturerRequest;
import com.swp391.lecturer.dto.UpdateLecturerRequest;
import com.swp391.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
@RequiredArgsConstructor
public class LecturerController {
    private final LecturerService lecturerService;

    @GetMapping
    public List<LecturerEntity> list() {
        return lecturerService.listAll();
    }

    @GetMapping("/{id}")
    public LecturerEntity getById(@PathVariable Integer id) {
        return lecturerService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LecturerEntity create(@Valid @RequestBody CreateLecturerRequest request, Authentication auth) {
        return lecturerService.create(request, (UserPrincipal) auth.getPrincipal());
    }

    @PutMapping("/{id}")
    public LecturerEntity update(@PathVariable Integer id, @Valid @RequestBody UpdateLecturerRequest request,
            Authentication auth) {
        return lecturerService.update(id, request, (UserPrincipal) auth.getPrincipal());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id, Authentication auth) {
        lecturerService.delete(id, (UserPrincipal) auth.getPrincipal());
    }
}

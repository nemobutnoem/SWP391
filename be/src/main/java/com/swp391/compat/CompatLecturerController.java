package com.swp391.compat;

import com.swp391.lecturer.LecturerEntity;
import com.swp391.lecturer.LecturerRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CompatLecturerController {

    private final LecturerRepository lecturerRepository;

    public CompatLecturerController(LecturerRepository lecturerRepository) {
        this.lecturerRepository = lecturerRepository;
    }

    @GetMapping("/lecturers")
    public List<LecturerEntity> list(Authentication auth) {
        return lecturerRepository.findAll();
    }
}

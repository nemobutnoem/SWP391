package com.swp391.semester;

import com.swp391.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {
    private final SemesterRepository semesterRepository;

    public List<SemesterEntity> listAll() {
        return semesterRepository.findAll();
    }

    public SemesterEntity getActiveSemester() {
        return semesterRepository.findByStatusIgnoreCase("active")
                .orElseThrow(() -> ApiException.notFound("No active semester found"));
    }

    public SemesterEntity getById(Integer id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Semester not found with id: " + id));
    }
}

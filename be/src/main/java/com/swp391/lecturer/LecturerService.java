package com.swp391.lecturer;

import com.swp391.common.ApiException;
import com.swp391.lecturer.dto.CreateLecturerRequest;
import com.swp391.lecturer.dto.UpdateLecturerRequest;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {
    private final LecturerRepository lecturerRepository;

    public List<LecturerEntity> listAll() {
        return lecturerRepository.findAll();
    }

    public LecturerEntity getById(Integer id) {
        return lecturerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Lecturer not found with id: " + id));
    }

    @Transactional
    public LecturerEntity create(CreateLecturerRequest request, UserPrincipal principal) {
        ensureAdmin(principal);

        LecturerEntity entity = new LecturerEntity();
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setStatus(request.status() != null ? request.status() : "Active");
        return lecturerRepository.save(entity);
    }

    @Transactional
    public LecturerEntity update(Integer id, UpdateLecturerRequest request, UserPrincipal principal) {
        ensureAdmin(principal);

        LecturerEntity entity = lecturerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Lecturer not found with id: " + id));

        if (request.fullName() != null) {
            entity.setFullName(request.fullName());
        }
        if (request.email() != null) {
            entity.setEmail(request.email());
        }
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        return lecturerRepository.save(entity);
    }

    @Transactional
    public void delete(Integer id, UserPrincipal principal) {
        ensureAdmin(principal);

        if (!lecturerRepository.existsById(id)) {
            throw ApiException.notFound("Lecturer not found with id: " + id);
        }
        lecturerRepository.deleteById(id);
    }

    private void ensureAdmin(UserPrincipal principal) {
        if (!"Admin".equalsIgnoreCase(principal.getRole())) {
            throw ApiException.forbidden("Only Admin can manage lecturers");
        }
    }
}

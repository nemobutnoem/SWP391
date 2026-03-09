package com.swp391.lecturer;

import com.swp391.clazz.ClassRepository;
import com.swp391.common.ApiException;
import com.swp391.group.StudentGroupRepository;
import com.swp391.lecturer.dto.CreateLecturerRequest;
import com.swp391.lecturer.dto.UpdateLecturerRequest;
import com.swp391.user.UserRepository;
import com.swp391.user.UserEntity;
import com.swp391.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {
    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final StudentGroupRepository groupRepository;

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

        UserEntity user = new UserEntity();
        String account = request.email() != null && request.email().contains("@") ? request.email().split("@")[0]
                : request.email();
        user.setAccount(account);
        user.setRole("LECTURER");
        user.setGithubUsername(request.githubUsername());
        user.setStatus(request.status() != null ? request.status() : "Active");
        user = userRepository.save(user);

        LecturerEntity entity = new LecturerEntity();
        entity.setUserId(user.getId());
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setDepartment(request.department());
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
        if (request.department() != null) {
            entity.setDepartment(request.department());
        }
        if (request.status() != null) {
            entity.setStatus(request.status());
        }

        if (entity.getUserId() != null) {
            userRepository.findById(entity.getUserId()).ifPresent(user -> {
                if (request.githubUsername() != null)
                    user.setGithubUsername(request.githubUsername());
                if (request.email() != null && request.email().contains("@"))
                    user.setAccount(request.email().split("@")[0]);
                userRepository.save(user);
            });
        }
        return lecturerRepository.save(entity);
    }

    @Transactional
    public void delete(Integer id, UserPrincipal principal) {
        ensureAdmin(principal);

        if (!lecturerRepository.existsById(id)) {
            throw ApiException.notFound("Lecturer not found with id: " + id);
        }
        if (!classRepository.findByLecturerId(id).isEmpty()) {
            throw ApiException.badRequest("Cannot delete lecturer: they are still assigned to classes. Unassign them first.");
        }
        if (!groupRepository.findByLecturerId(id).isEmpty()) {
            throw ApiException.badRequest("Cannot delete lecturer: they are still supervising groups. Unassign them first.");
        }
        lecturerRepository.deleteById(id);
    }

    private void ensureAdmin(UserPrincipal principal) {
        if (!"Admin".equalsIgnoreCase(principal.getRole())) {
            throw ApiException.forbidden("Only Admin can manage lecturers");
        }
    }
}

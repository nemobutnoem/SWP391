package com.swp391.clazz;

import com.swp391.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassService {
    private final ClassRepository classRepository;

    public List<ClassEntity> listAll() {
        return classRepository.findAll();
    }

    public List<ClassEntity> findBySemester(Integer semesterId) {
        return classRepository.findBySemesterId(semesterId);
    }

    public ClassEntity getById(Integer id) {
        return classRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Class not found with id: " + id));
    }
}

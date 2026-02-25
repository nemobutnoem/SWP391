package com.swp391.demo.service.lecture;

import java.util.List;

import org.springframework.stereotype.Service;

import com.swp391.demo.entity.Lecture.Lecture;
import com.swp391.demo.repository.lecture.LectureRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LectureServiceImpl implements LectureService {
    private final LectureRepository lectureRepository;
    private final com.swp391.demo.repository.UserRepository userRepository;

    @Override
    public List<Lecture> getAllLectures() {
        return lectureRepository.findAll();
    }

    @Override
    public Lecture getLectureById(Long id) {
        return lectureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecture not found"));

    }

    @Override
    public Lecture createLecture(Lecture lecture) {
        if (lecture.getUserId() == null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String username = auth.getName();
                userRepository.findByUsername(username).ifPresent(user -> lecture.setUserId(user.getId()));
            }
        }
        return lectureRepository.save(lecture);
    }

    @Override
    public Lecture updateLecture(Long id, Lecture lecture) {
        if (lecture.getId() == null) {
            throw new IllegalArgumentException("Lecture ID is required for update");
        }
        if (!lectureRepository.existsById(lecture.getId())) {
            throw new IllegalArgumentException("Lecture not found with id" + lecture.getId());
        }
        Lecture updateLecture = lectureRepository.save(lecture);
        return updateLecture;
    }

    @Override
    public void deleteLecture(Long id) {
        if (!lectureRepository.existsById(id)) {
            throw new IllegalArgumentException("Lecture not found with id: " + id);
        }

        lectureRepository.deleteById(id);
    }

}

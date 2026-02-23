package com.swp391.demo.service.lecture;

import java.util.List;

import org.springframework.stereotype.Service;

import com.swp391.demo.entity.Lecture.Lecture;
import com.swp391.demo.repository.lecture.LectureRepository;
@Service

public class LectureServiceImpl implements LectureService {
    private  LectureRepository lectureRepository ;


    @Override
    public List<Lecture> getAllLectures() {
        return lectureRepository.findAll();
    }
    @Override
    public Lecture getLectureById(Long id) {
        return lectureRepository.findById(id)
        .orElseThrow(()-> new RuntimeException( "Lecture not found"));
        
        
  }

    @Override
    public Lecture createLecture(Lecture lecture) {
        return lectureRepository.save(lecture);
    }

    @Override
    public Lecture updateLecture(Long id,Lecture lecture) {
        if(lecture.getId()==null){
            throw new IllegalArgumentException("Lecture ID is required for update");
        }
        if(!lectureRepository.existsById(lecture.getId())){
            throw new IllegalArgumentException("Lecture not found with id"+lecture.getId());
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

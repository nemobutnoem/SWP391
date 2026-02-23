package com.swp391.demo.service.lecture;

import java.util.List;

import com.swp391.demo.entity.Lecture.Lecture;

public interface LectureService {
List<Lecture> getAllLectures();
Lecture getLectureById(Long id);
Lecture createLecture(Lecture lecture);
Lecture updateLecture(Long id,Lecture lecture);
void deleteLecture(Long id);
}

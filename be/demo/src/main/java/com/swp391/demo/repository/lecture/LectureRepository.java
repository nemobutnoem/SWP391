package com.swp391.demo.repository.lecture;

import org.springframework.data.jpa.repository.JpaRepository;

import com.swp391.demo.entity.Lecture.Lecture;

public interface LectureRepository extends JpaRepository<Lecture,Long> {

    
} 

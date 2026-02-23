package com.swp391.demo.controller.lecture;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.demo.entity.Lecture.Lecture;
import com.swp391.demo.service.lecture.LectureService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
public class LectureController {
private final LectureService lectureService;

@GetMapping
public ResponseEntity<List<Lecture>> getAllLectures(){
    return ResponseEntity.ok(lectureService.getAllLectures());
}

@GetMapping("/id")
public ResponseEntity<Lecture> getLectureById(@PathVariable Long id){
    return ResponseEntity.ok(lectureService.getLectureById(id));
}

@PostMapping
public ResponseEntity<Lecture> createLecture(@RequestBody Lecture lecture){
    Lecture saved = lectureService.createLecture(lecture);
    return ResponseEntity.ok(saved);
}
@PutMapping("/id")
public ResponseEntity<Lecture> updateLecture(@PathVariable Long id,@RequestBody Lecture lecture){
    return ResponseEntity.ok(lectureService.updateLecture(id,lecture));
}
@DeleteMapping("/id")
public ResponseEntity<String> deleteLecture(@PathVariable Long id){
    lectureService.deleteLecture(id);
    return ResponseEntity.ok("Lecture delete successfully");
}
}

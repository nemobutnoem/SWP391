package com.swp391.semester;

import com.swp391.clazz.ClassEntity;
import com.swp391.clazz.ClassRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily scheduler that auto-completes classes and semesters
 * when their end_date has passed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.semester.auto-complete-enabled", havingValue = "true")
public class SemesterScheduler {

    private final SemesterRepository semesterRepository;
    private final ClassRepository classRepository;

    // Runs every day at 00:05
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void autoCompleteExpired() {
        LocalDate today = LocalDate.now();
        int classCount = 0;
        int semesterCount = 0;

        // 1. Auto-complete Active classes whose end_date has passed
        List<ClassEntity> allClasses = classRepository.findAll();
        for (ClassEntity cls : allClasses) {
            if ("Active".equalsIgnoreCase(cls.getStatus())
                    && cls.getEndDate() != null
                    && !cls.getEndDate().isAfter(today)) {
                cls.setStatus("Completed");
                classRepository.save(cls);
                classCount++;
                log.info("Auto-completed class '{}' (end_date: {})", cls.getClassCode(), cls.getEndDate());
            }
        }

        // 2. Auto-complete Active semesters whose end_date has passed
        //    OR all classes are completed
        List<SemesterEntity> allSemesters = semesterRepository.findAll();
        for (SemesterEntity sem : allSemesters) {
            if (!"Active".equalsIgnoreCase(sem.getStatus())) continue;

            boolean dateExpired = sem.getEndDate() != null && !sem.getEndDate().isAfter(today);

            List<ClassEntity> semClasses = classRepository.findBySemesterId(sem.getId());
            boolean allClassesCompleted = !semClasses.isEmpty()
                    && semClasses.stream().allMatch(c -> "Completed".equalsIgnoreCase(c.getStatus()));

            if (dateExpired || allClassesCompleted) {
                // Also complete any remaining active classes in this semester
                for (ClassEntity cls : semClasses) {
                    if ("Active".equalsIgnoreCase(cls.getStatus())) {
                        cls.setStatus("Completed");
                        classRepository.save(cls);
                        classCount++;
                    }
                }
                sem.setStatus("Completed");
                semesterRepository.save(sem);
                semesterCount++;
                log.info("Auto-completed semester '{}' (end_date: {}, allClassesDone: {})",
                        sem.getCode(), sem.getEndDate(), allClassesCompleted);
            }
        }

        if (classCount > 0 || semesterCount > 0) {
            log.info("Auto-complete summary: {} class(es), {} semester(s) completed", classCount, semesterCount);
        }
    }
}

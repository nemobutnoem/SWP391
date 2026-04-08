package com.swp391.student;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StudentClassHistoryService {
    private final StudentClassHistoryRepository historyRepository;

    /**
     * Record a student's MAIN class assignment changes over time.
     * - If newClassId is null: close current open record (if any).
     * - If newClassId is not null:
     *   - close current open record if it's different
     *   - create a new record if needed
     */
    public void recordClassChange(Integer studentId, Integer previousClassId, Integer newClassId, LocalDateTime seedAssignedAt) {
        if (studentId == null) return;

        boolean changed =
                (previousClassId == null && newClassId != null)
                        || (previousClassId != null && newClassId == null)
                        || (previousClassId != null && !previousClassId.equals(newClassId));
        if (!changed) return;

        LocalDateTime now = LocalDateTime.now();
        var openOpt = historyRepository.findOpenByStudentId(studentId);

        // If no open record exists but student previously had a class, seed it so we don't lose the old class on first change.
        if (openOpt.isEmpty() && previousClassId != null) {
            StudentClassHistoryEntity seed = new StudentClassHistoryEntity();
            seed.setStudentId(studentId);
            seed.setClassId(previousClassId);
            seed.setAssignedAt(seedAssignedAt != null ? seedAssignedAt : now);
            seed.setUnassignedAt(now);
            historyRepository.save(seed);
        }

        // Close open record if present
        openOpt.ifPresent(open -> {
            if (open.getUnassignedAt() == null) {
                open.setUnassignedAt(now);
                historyRepository.save(open);
            }
        });

        // Create new open record
        if (newClassId != null) {
            StudentClassHistoryEntity next = new StudentClassHistoryEntity();
            next.setStudentId(studentId);
            next.setClassId(newClassId);
            next.setAssignedAt(now);
            historyRepository.save(next);
        }
    }
}

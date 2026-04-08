package com.swp391.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "student_class_history", schema = "dbo")
public class StudentClassHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("student_id")
    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @JsonProperty("class_id")
    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @JsonProperty("assigned_at")
    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;

    @JsonProperty("unassigned_at")
    @Column(name = "unassigned_at")
    private LocalDateTime unassignedAt;
}

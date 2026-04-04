package com.swp391.clazz;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "class_enrollments", schema = "dbo")
public class ClassEnrollmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("student_id")
    @Column(name = "student_id")
    private Integer studentId;

    @JsonProperty("class_id")
    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "status")
    private String status;

    @JsonProperty("enrolled_at")
    @Column(name = "enrolled_at", insertable = false, updatable = false)
    private LocalDateTime enrolledAt;
}

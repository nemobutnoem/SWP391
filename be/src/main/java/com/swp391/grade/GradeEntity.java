package com.swp391.grade;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "grades", schema = "dbo")
public class GradeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("group_id")
    @Column(name = "group_id")
    private Integer groupId;

    @JsonProperty("lecturer_id")
    @Column(name = "lecturer_id")
    private Integer lecturerId;

    @Column(name = "milestone")
    private String milestone;

    @Column(name = "score")
    private BigDecimal score;

    @Column(name = "feedback")
    private String feedback;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "status")
    private String status;

    @JsonProperty("created_at")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}

package com.swp391.clazz;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "classes", schema = "dbo")
public class ClassEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "class_code")
	private String classCode;

	@Column(name = "semester_id")
	private Integer semesterId;

	@Column(name = "class_name")
	private String className;

	@Column(name = "major")
	private String major;

	@Column(name = "intake_year")
	private Integer intakeYear;

	@Column(name = "department")
	private String department;

	@Column(name = "status")
	private String status;

	@Column(name = "lecturer_id")
	private Integer lecturerId;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;
}

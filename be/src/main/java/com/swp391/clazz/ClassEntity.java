package com.swp391.clazz;

import com.fasterxml.jackson.annotation.JsonProperty;
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

	@JsonProperty("class_code")
	@Column(name = "class_code")
	private String classCode;

	@JsonProperty("semester_id")
	@Column(name = "semester_id")
	private Integer semesterId;

	@JsonProperty("class_name")
	@Column(name = "class_name")
	private String className;

	@Column(name = "major")
	private String major;

	@JsonProperty("intake_year")
	@Column(name = "intake_year")
	private Integer intakeYear;

	@Column(name = "department")
	private String department;

	@Column(name = "status")
	private String status;

	@JsonProperty("lecturer_id")
	@Column(name = "lecturer_id")
	private Integer lecturerId;

	@JsonProperty("created_at")
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@JsonProperty("updated_at")
	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;
}

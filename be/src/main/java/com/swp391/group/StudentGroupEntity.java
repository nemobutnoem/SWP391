package com.swp391.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "groups", schema = "dbo")
public class StudentGroupEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@JsonProperty("semester_id")
	@Column(name = "semester_id")
	private Integer semesterId;

	@JsonProperty("class_id")
	@Column(name = "class_id")
	private Integer classId;

	@JsonProperty("project_id")
	@Column(name = "project_id")
	private Integer projectId;

	@JsonProperty("group_code")
	@Column(name = "group_code")
	private String groupCode;

	@JsonProperty("group_name")
	@Column(name = "group_name")
	private String groupName;

	@Column(name = "description")
	private String description;

	@Column(name = "status")
	private String status;

	@JsonProperty("leader_student_id")
	@Column(name = "leader_student_id")
	private Integer leaderStudentId;

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

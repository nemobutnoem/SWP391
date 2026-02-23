package com.swp391.group;

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

	@Column(name = "semester_id")
	private Integer semesterId;

	@Column(name = "class_id")
	private Integer classId;

	@Column(name = "project_id")
	private Integer projectId;

	@Column(name = "group_code")
	private String groupCode;

	@Column(name = "group_name")
	private String groupName;

	@Column(name = "description")
	private String description;

	@Column(name = "status")
	private String status;

	@Column(name = "leader_student_id")
	private Integer leaderStudentId;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private LocalDateTime updatedAt;
}

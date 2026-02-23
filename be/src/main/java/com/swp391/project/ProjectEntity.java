package com.swp391.project;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "projects", schema = "dbo")
public class ProjectEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "semester_id")
	private Integer semesterId;

	@Column(name = "project_code")
	private String projectCode;

	@Column(name = "project_name")
	private String projectName;

	@Column(name = "description")
	private String description;

	@Column(name = "status")
	private String status;
}

package com.swp391.project;

import com.fasterxml.jackson.annotation.JsonProperty;
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

	@JsonProperty("semester_id")
	@Column(name = "semester_id")
	private Integer semesterId;

	@JsonProperty("project_code")
	@Column(name = "project_code")
	private String projectCode;

	@JsonProperty("project_name")
	@Column(name = "project_name")
	private String projectName;

	@Column(name = "description")
	private String description;

	@Column(name = "status")
	private String status;

	/** AllocationView.jsx uses t.name */
	@JsonProperty("name")
	public String getName() {
		return projectName;
	}

	@JsonProperty("code")
	public String getCode() {
		return projectCode;
	}
}

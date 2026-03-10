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
<<<<<<< Updated upstream
=======

	/** AllocationView.jsx uses t.name */
	@JsonProperty("name")
	public String getName() {
		return projectName;
	}

	/** TopicsView.jsx uses topic.code */
	@JsonProperty("code")
	public String getCode() {
		return projectCode;
	}
>>>>>>> Stashed changes
}

package com.swp391.lecturer;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "lecturers", schema = "dbo")
public class LecturerEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@JsonProperty("user_id")
	@Column(name = "user_id")
	private Integer userId;

	@JsonProperty("full_name")
	@Column(name = "full_name")
	private String fullName;

	@Column(name = "email")
	private String email;

	@Column(name = "status")
	private String status;

	@JsonProperty("created_at")
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}

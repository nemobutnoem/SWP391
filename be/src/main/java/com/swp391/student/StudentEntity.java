package com.swp391.student;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "students", schema = "dbo")
public class StudentEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id")
	private Integer userId;

	@Column(name = "class_id")
	private Integer classId;

	@Column(name = "full_name")
	private String fullName;

	@Column(name = "student_code")
	private String studentCode;

	@Column(name = "email")
	private String email;

	@Column(name = "status")
	private String status;
}

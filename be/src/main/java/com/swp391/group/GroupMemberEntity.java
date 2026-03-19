package com.swp391.group;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "group_members", schema = "dbo")
public class GroupMemberEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "student_id")
	private Integer studentId;

	@Column(name = "role_in_group")
	private String roleInGroup;

	@Column(name = "status")
	private String status;

	@Column(name = "joined_at")
	private LocalDateTime joinedAt;

	@Column(name = "left_at")
	private LocalDateTime leftAt;
=======
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members")
@Data
public class GroupMemberEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "group_id")
    private Integer groupId;

    @Column(name = "student_id")
    private Integer studentId;

    @Column(name = "role_in_group")
    private String roleInGroup;

    @Column(name = "status")
    private String status;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}

package com.swp391.demo.entity.groupmember;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Group_Member")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GroupMember {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(name = "id")
private Long id;

@Column(name = "group_id")
private Long groupId;

@Column(name = "student_id")
private Long studentId;

@Column(name = "role_in_group")
private String roleInGroup;

@Column(name = "status")
private String status;

@Column(name = "joined_at")
@CreationTimestamp
private LocalDateTime joinedAt;

@Column(name = "left_at")
private LocalDateTime leftAt;

@Column(name = "created_at")
@CreationTimestamp
private LocalDateTime createdAt;

@Column(name = "updated_at")
@CreationTimestamp
private LocalDateTime updatedAt;
}

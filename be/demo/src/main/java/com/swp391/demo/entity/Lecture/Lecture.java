package com.swp391.demo.entity.Lecture;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.swp391.demo.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Lecture")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Lecture {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(name = "id")
private Long id;

@Column(name = "user_id")
private Long userId;

@Column(name = "fullname")
@NotBlank(message = "Fullname is required")
private String fullName;

@Column(name = "email")
@NotBlank(message = "Email is required")
@Email(message = "Invalid email format")
private String email;

@Column(name = "status")
private String status;

@Column(name = "create_at")
private LocalDateTime createTime;

@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;
}

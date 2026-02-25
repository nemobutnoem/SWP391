CREATE TABLE IF NOT EXISTS `User` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `account` VARCHAR(255) NULL,
  `role` VARCHAR(50) NULL,
  `github_username` VARCHAR(255) NULL,
  `jira_account_id` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_github_username` (`github_username`),
  UNIQUE KEY `uk_user_jira_account_id` (`jira_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Lecturer` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lecturer_user_id` (`user_id`),
  CONSTRAINT `fk_lecturer_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Class` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `class_code` VARCHAR(255) NOT NULL,
  `class_name` VARCHAR(255) NULL,
  `major` VARCHAR(255) NULL,
  `intake_year` INT NULL,
  `department` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `lecturer_id` BIGINT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_code` (`class_code`),
  KEY `idx_class_lecturer_id` (`lecturer_id`),
  CONSTRAINT `fk_class_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `Lecturer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Student` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `class_id` BIGINT NULL,
  `full_name` VARCHAR(255) NULL,
  `student_code` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_user_id` (`user_id`),
  UNIQUE KEY `uk_student_student_code` (`student_code`),
  UNIQUE KEY `uk_student_email` (`email`),
  KEY `idx_student_class_id` (`class_id`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`),
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `Class` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `SWP_Semester` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_semester_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `semester_id` BIGINT NOT NULL,
  `project_code` VARCHAR(255) NULL,
  `project_name` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_semester_id` (`semester_id`),
  CONSTRAINT `fk_project_semester` FOREIGN KEY (`semester_id`) REFERENCES `SWP_Semester` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Student_Group` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `semester_id` BIGINT NOT NULL,
  `class_id` BIGINT NOT NULL,
  `project_id` BIGINT NULL,
  `group_code` VARCHAR(255) NULL,
  `group_name` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `status` VARCHAR(50) NULL,
  `leader_student_id` BIGINT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_code_per_class_sem` (`semester_id`, `class_id`, `group_code`),
  UNIQUE KEY `uk_topic_per_class` (`class_id`, `project_id`),
  KEY `idx_group_semester_id` (`semester_id`),
  KEY `idx_group_class_id` (`class_id`),
  KEY `idx_group_project_id` (`project_id`),
  KEY `idx_group_leader_student_id` (`leader_student_id`),
  CONSTRAINT `fk_group_semester` FOREIGN KEY (`semester_id`) REFERENCES `SWP_Semester` (`id`),
  CONSTRAINT `fk_group_class` FOREIGN KEY (`class_id`) REFERENCES `Class` (`id`),
  CONSTRAINT `fk_group_project` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`),
  CONSTRAINT `fk_group_leader_student` FOREIGN KEY (`leader_student_id`) REFERENCES `Student` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Group_Member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `role_in_group` VARCHAR(50) NULL,
  `status` VARCHAR(50) NULL,
  `joined_at` TIMESTAMP NULL,
  `left_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_member` (`group_id`, `student_id`),
  KEY `idx_group_member_student_id` (`student_id`),
  CONSTRAINT `fk_group_member_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`),
  CONSTRAINT `fk_group_member_student` FOREIGN KEY (`student_id`) REFERENCES `Student` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Jira_Project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `jira_project_key` VARCHAR(255) NULL,
  `jira_project_id` VARCHAR(255) NULL,
  `jira_base_url` VARCHAR(255) NULL,
  `project_name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jira_project_group_id` (`group_id`),
  CONSTRAINT `fk_jira_project_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Github_Repository` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `repo_url` VARCHAR(512) NULL,
  `repo_owner` VARCHAR(255) NULL,
  `repo_name` VARCHAR(255) NULL,
  `default_branch` VARCHAR(255) NULL,
  `visibility` VARCHAR(50) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_repo_url` (`group_id`, `repo_url`),
  KEY `idx_repo_group_id` (`group_id`),
  CONSTRAINT `fk_repo_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Jira_Issue` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `jira_issue_id` VARCHAR(255) NOT NULL,
  `jira_issue_key` VARCHAR(255) NOT NULL,
  `issue_type` VARCHAR(100) NOT NULL,
  `summary` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `priority` VARCHAR(100) NULL,
  `parent_issue_key` VARCHAR(255) NULL,
  `epic_issue_key` VARCHAR(255) NULL,
  `assignee_user_id` BIGINT NULL,
  `reporter_user_id` BIGINT NULL,
  `jira_created_at` TIMESTAMP NULL,
  `jira_updated_at` TIMESTAMP NULL,
  `last_synced_at` TIMESTAMP NULL,
  `sync_status` VARCHAR(50) NULL,
  `sync_error` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_issue_group_key` (`group_id`, `jira_issue_key`),
  UNIQUE KEY `uk_issue_group_id` (`group_id`, `jira_issue_id`),
  KEY `idx_issue_group_id` (`group_id`),
  KEY `idx_issue_assignee_user_id` (`assignee_user_id`),
  KEY `idx_issue_reporter_user_id` (`reporter_user_id`),
  CONSTRAINT `fk_issue_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`),
  CONSTRAINT `fk_issue_assignee_user` FOREIGN KEY (`assignee_user_id`) REFERENCES `User` (`id`),
  CONSTRAINT `fk_issue_reporter_user` FOREIGN KEY (`reporter_user_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Jira_Sprint` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `jira_sprint_id` INT NOT NULL,
  `jira_board_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `goal` TEXT NULL,
  `state` VARCHAR(50) NULL,
  `start_date` TIMESTAMP NULL,
  `end_date` TIMESTAMP NULL,
  `complete_date` TIMESTAMP NULL,
  `last_synced_at` TIMESTAMP NULL,
  `sync_status` VARCHAR(50) NULL,
  `sync_error` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sprint_group_id_sprint` (`group_id`, `jira_sprint_id`),
  CONSTRAINT `fk_sprint_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Jira_Issue_Sprint` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `jira_issue_id` VARCHAR(255) NOT NULL,
  `jira_sprint_id` INT NOT NULL,
  `added_at` TIMESTAMP NULL,
  `removed_at` TIMESTAMP NULL,
  `last_synced_at` TIMESTAMP NULL,
  `sync_status` VARCHAR(50) NULL,
  `sync_error` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_issue_sprint_group` (`group_id`, `jira_issue_id`, `jira_sprint_id`),
  CONSTRAINT `fk_issue_sprint_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Outbound_Sync_Log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `target` VARCHAR(50) NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_local_id` BIGINT NULL,
  `remote_id` VARCHAR(255) NULL,
  `action` VARCHAR(100) NULL,
  `requested_by_user_id` BIGINT NULL,
  `request_payload` JSON NULL,
  `response_payload` JSON NULL,
  `status` VARCHAR(50) NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_outbound_requested_by_user_id` (`requested_by_user_id`),
  CONSTRAINT `fk_outbound_requested_by_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Github_Activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `actor_user_id` BIGINT NULL,
  `github_username` VARCHAR(255) NULL,
  `activity_type` VARCHAR(100) NULL,
  `commit_sha` VARCHAR(255) NULL,
  `commit_message` TEXT NULL,
  `ref_name` VARCHAR(255) NULL,
  `pushed_commit_count` INT NULL,
  `occurred_at` TIMESTAMP NULL,
  `raw_payload` JSON NULL,
  `github_event_id` VARCHAR(255) NULL,
  `last_synced_at` TIMESTAMP NULL,
  `sync_status` VARCHAR(50) NULL,
  `sync_error` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_github_activity_event` (`group_id`, `github_event_id`),
  KEY `idx_github_activity_group_id` (`group_id`),
  KEY `idx_github_activity_actor_user_id` (`actor_user_id`),
  CONSTRAINT `fk_github_activity_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`),
  CONSTRAINT `fk_github_activity_actor_user` FOREIGN KEY (`actor_user_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Report` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL,
  `report_type` VARCHAR(50) NULL,
  `period_start` DATE NULL,
  `period_end` DATE NULL,
  `title` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `status` VARCHAR(50) NULL,
  `attempt_no` INT NULL,
  `feedback` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by_user_id` BIGINT NULL,
  `graded_by_user_id` BIGINT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_report_group_id` (`group_id`),
  KEY `idx_report_created_by_user_id` (`created_by_user_id`),
  KEY `idx_report_graded_by_user_id` (`graded_by_user_id`),
  CONSTRAINT `fk_report_group` FOREIGN KEY (`group_id`) REFERENCES `Student_Group` (`id`),
  CONSTRAINT `fk_report_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `User` (`id`),
  CONSTRAINT `fk_report_graded_by_user` FOREIGN KEY (`graded_by_user_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

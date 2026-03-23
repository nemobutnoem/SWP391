-- =============================================
-- SWP391 - Seed Data
-- Chạy trên SQL Server, database SWP391
-- Thứ tự INSERT đảm bảo FK constraints
-- =============================================

USE [SWP391]
GO

-- Xóa dữ liệu cũ (nếu cần chạy lại)
-- Thứ tự xóa ngược với thứ tự insert
DELETE FROM dbo.outbound_sync_logs;
DELETE FROM dbo.github_activities;
DELETE FROM dbo.github_repositories;
DELETE FROM dbo.task_comments;
DELETE FROM dbo.jira_issue_sprints;
DELETE FROM dbo.jira_issues;
DELETE FROM dbo.jira_sprints;
DELETE FROM dbo.jira_projects;
DELETE FROM dbo.group_integrations;
DELETE FROM dbo.grades;
DELETE FROM dbo.group_members;
DELETE FROM dbo.groups;
DELETE FROM dbo.students;
DELETE FROM dbo.classes;
DELETE FROM dbo.lecturers;
DELETE FROM dbo.projects;
DELETE FROM dbo.admin_integrations;
DELETE FROM dbo.users;
DELETE FROM dbo.swp_semesters;
GO

-- Reset IDENTITY seeds
DBCC CHECKIDENT ('dbo.swp_semesters', RESEED, 0);
DBCC CHECKIDENT ('dbo.users', RESEED, 0);
DBCC CHECKIDENT ('dbo.lecturers', RESEED, 0);
DBCC CHECKIDENT ('dbo.projects', RESEED, 0);
DBCC CHECKIDENT ('dbo.classes', RESEED, 0);
DBCC CHECKIDENT ('dbo.students', RESEED, 0);
DBCC CHECKIDENT ('dbo.groups', RESEED, 0);
DBCC CHECKIDENT ('dbo.group_members', RESEED, 0);
DBCC CHECKIDENT ('dbo.grades', RESEED, 0);
DBCC CHECKIDENT ('dbo.admin_integrations', RESEED, 0);
DBCC CHECKIDENT ('dbo.group_integrations', RESEED, 0);
DBCC CHECKIDENT ('dbo.jira_projects', RESEED, 0);
DBCC CHECKIDENT ('dbo.jira_sprints', RESEED, 0);
DBCC CHECKIDENT ('dbo.jira_issues', RESEED, 0);
DBCC CHECKIDENT ('dbo.jira_issue_sprints', RESEED, 0);
DBCC CHECKIDENT ('dbo.task_comments', RESEED, 0);
DBCC CHECKIDENT ('dbo.github_repositories', RESEED, 0);
DBCC CHECKIDENT ('dbo.github_activities', RESEED, 0);
DBCC CHECKIDENT ('dbo.outbound_sync_logs', RESEED, 0);
GO

-- =============================================
-- 1. swp_semesters (2 học kỳ)
-- =============================================
SET IDENTITY_INSERT dbo.swp_semesters ON;
INSERT INTO dbo.swp_semesters (id, code, name, start_date, end_date, status, created_at, updated_at) VALUES
(1, 'SP25', N'Spring 2025',   '2025-01-06', '2025-05-10', 'active',   GETDATE(), GETDATE()),
(2, 'SU25', N'Summer 2025',   '2025-05-19', '2025-08-30', 'inactive', GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.swp_semesters OFF;
GO

-- =============================================
-- 2. users (1 admin + 2 lecturers + 10 students = 13 users)
-- Password hash = BCrypt của "password123"
-- =============================================
SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users (id, account, role, github_username, jira_account_id, status, password_hash, created_at, updated_at) VALUES
-- Admin
(1,  'admin@fpt.edu.vn',          'admin',    NULL,           NULL,                    'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
-- Lecturers
(2,  'sonnt@fpt.edu.vn',          'lecturer', 'sonnt-github', '712020:abc11111-1111',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(3,  'hoanglm@fpt.edu.vn',        'lecturer', 'hoanglm-gh',  '712020:abc22222-2222',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
-- Students (Group 1 - 5 members)
(4,  'hungse182001@fpt.edu.vn',   'student',  'hung-dev',     '712020:stu11111-1111',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(5,  'minhse182002@fpt.edu.vn',   'student',  'minh-dev',     '712020:stu22222-2222',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(6,  'lanse182003@fpt.edu.vn',    'student',  'lan-dev',      '712020:stu33333-3333',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(7,  'ducse182004@fpt.edu.vn',    'student',  'duc-dev',      '712020:stu44444-4444',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(8,  'trangse182005@fpt.edu.vn',  'student',  'trang-dev',    '712020:stu55555-5555',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
-- Students (Group 2 - 5 members)
(9,  'namse182006@fpt.edu.vn',    'student',  'nam-dev',      '712020:stu66666-6666',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(10, 'hase182007@fpt.edu.vn',     'student',  'ha-dev',       '712020:stu77777-7777',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(11, 'longse182008@fpt.edu.vn',   'student',  'long-dev',     '712020:stu88888-8888',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(12, 'thyse182009@fpt.edu.vn',    'student',  'thy-dev',      '712020:stu99999-9999',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE()),
(13, 'khoase182010@fpt.edu.vn',   'student',  'khoa-dev',     '712020:stuAAAAA-AAAA',  'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.users OFF;
GO

-- =============================================
-- 3. lecturers (2 giảng viên)
-- =============================================
SET IDENTITY_INSERT dbo.lecturers ON;
INSERT INTO dbo.lecturers (id, user_id, full_name, email, department, status, created_at) VALUES
(1, 2, N'Nguyễn Thanh Sơn',  'sonnt@fpt.edu.vn',   'Software Engineering', 'active', GETDATE()),
(2, 3, N'Lê Minh Hoàng',     'hoanglm@fpt.edu.vn', 'Software Engineering', 'active', GETDATE());
SET IDENTITY_INSERT dbo.lecturers OFF;
GO

-- =============================================
-- 4. projects (3 đề tài cho semester SP25)
-- =============================================
SET IDENTITY_INSERT dbo.projects ON;
INSERT INTO dbo.projects (id, semester_id, project_code, project_name, description, status, created_at, updated_at) VALUES
(1, 1, 'PRJ-001', N'Hệ thống quản lý phòng khám',       'Online clinic management system',          'active', GETDATE(), GETDATE()),
(2, 1, 'PRJ-002', N'Sàn thương mại điện tử thời trang',  'Fashion e-commerce platform',              'active', GETDATE(), GETDATE()),
(3, 1, 'PRJ-003', N'Ứng dụng đặt sân thể thao',         'Sports court booking application',          'active', GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.projects OFF;
GO

-- =============================================
-- 5. classes (2 lớp cho semester SP25)
-- =============================================
SET IDENTITY_INSERT dbo.classes ON;
INSERT INTO dbo.classes (id, class_code, semester_id, class_name, major, intake_year, department, status, lecturer_id, created_at, updated_at) VALUES
(1, 'SE1856', 1, N'SE1856 - Software Engineering', 'Software Engineering', 2022, 'Information Technology', 'active', 1, GETDATE(), GETDATE()),
(2, 'SE1857', 1, N'SE1857 - Software Engineering', 'Software Engineering', 2022, 'Information Technology', 'active', 2, GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.classes OFF;
GO

-- =============================================
-- 6. students (10 sinh viên, 5 mỗi lớp)
-- =============================================
SET IDENTITY_INSERT dbo.students ON;
INSERT INTO dbo.students (id, user_id, class_id, full_name, student_code, email, major, status, created_at) VALUES
-- Lớp SE1856
(1,  4,  1, N'Trần Văn Hùng',    'SE182001', 'hungse182001@fpt.edu.vn',  'Software Engineering', 'active', GETDATE()),
(2,  5,  1, N'Phạm Quốc Minh',   'SE182002', 'minhse182002@fpt.edu.vn',  'Software Engineering', 'active', GETDATE()),
(3,  6,  1, N'Nguyễn Thị Lan',    'SE182003', 'lanse182003@fpt.edu.vn',   'Software Engineering', 'active', GETDATE()),
(4,  7,  1, N'Lê Hoàng Đức',      'SE182004', 'ducse182004@fpt.edu.vn',   'Software Engineering', 'active', GETDATE()),
(5,  8,  1, N'Vũ Minh Trang',     'SE182005', 'trangse182005@fpt.edu.vn', 'Software Engineering', 'active', GETDATE()),
-- Lớp SE1857
(6,  9,  2, N'Hoàng Văn Nam',     'SE182006', 'namse182006@fpt.edu.vn',   'Software Engineering', 'active', GETDATE()),
(7,  10, 2, N'Đỗ Thị Hà',        'SE182007', 'hase182007@fpt.edu.vn',    'Software Engineering', 'active', GETDATE()),
(8,  11, 2, N'Bùi Thành Long',    'SE182008', 'longse182008@fpt.edu.vn',  'Software Engineering', 'active', GETDATE()),
(9,  12, 2, N'Trịnh Ngọc Thy',    'SE182009', 'thyse182009@fpt.edu.vn',   'Software Engineering', 'active', GETDATE()),
(10, 13, 2, N'Phan Đăng Khoa',    'SE182010', 'khoase182010@fpt.edu.vn',  'Software Engineering', 'active', GETDATE());
SET IDENTITY_INSERT dbo.students OFF;
GO

-- =============================================
-- 7. groups (2 nhóm)
-- =============================================
SET IDENTITY_INSERT dbo.groups ON;
INSERT INTO dbo.groups (id, semester_id, class_id, project_id, group_code, group_name, description, status, leader_student_id, lecturer_id, created_at, updated_at) VALUES
(1, 1, 1, 1, 'G01', N'Nhóm 1 - Clinic',   'Group working on clinic management',    'active', 1, 1, GETDATE(), GETDATE()),
(2, 1, 2, 2, 'G02', N'Nhóm 2 - Ecommerce', 'Group working on fashion e-commerce',  'active', 6, 2, GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.groups OFF;
GO

-- =============================================
-- 8. group_members (10 thành viên, 5 mỗi nhóm)
-- =============================================
SET IDENTITY_INSERT dbo.group_members ON;
INSERT INTO dbo.group_members (id, group_id, student_id, role_in_group, status, joined_at, left_at) VALUES
-- Nhóm 1
(1,  1, 1, 'leader', 'active', '2025-01-10 08:00:00', NULL),
(2,  1, 2, 'member', 'active', '2025-01-10 08:00:00', NULL),
(3,  1, 3, 'member', 'active', '2025-01-10 08:00:00', NULL),
(4,  1, 4, 'member', 'active', '2025-01-10 08:00:00', NULL),
(5,  1, 5, 'member', 'active', '2025-01-10 08:00:00', NULL),
-- Nhóm 2
(6,  2, 6,  'leader', 'active', '2025-01-10 08:00:00', NULL),
(7,  2, 7,  'member', 'active', '2025-01-10 08:00:00', NULL),
(8,  2, 8,  'member', 'active', '2025-01-10 08:00:00', NULL),
(9,  2, 9,  'member', 'active', '2025-01-10 08:00:00', NULL),
(10, 2, 10, 'member', 'active', '2025-01-10 08:00:00', NULL);
SET IDENTITY_INSERT dbo.group_members OFF;
GO

-- =============================================
-- 9. grades (điểm cho 2 nhóm, 2 milestone mỗi nhóm)
-- =============================================
SET IDENTITY_INSERT dbo.grades ON;
INSERT INTO dbo.grades (id, group_id, lecturer_id, milestone, score, feedback, date, status, created_at) VALUES
(1, 1, 1, 'Iteration 1', 8.50, 'Good progress on requirements and basic UI',       '2025-02-15', 'published', GETDATE()),
(2, 1, 1, 'Iteration 2', 9.00, 'Excellent backend implementation and testing',      '2025-03-15', 'published', GETDATE()),
(3, 2, 2, 'Iteration 1', 7.80, 'Decent start, need to improve database design',    '2025-02-15', 'published', GETDATE()),
(4, 2, 2, 'Iteration 2', 8.20, 'Good improvement, UI/UX is much better now',       '2025-03-15', 'draft',     GETDATE());
SET IDENTITY_INSERT dbo.grades OFF;
GO

-- =============================================
-- 10. admin_integrations (cấu hình chung)
-- =============================================
SET IDENTITY_INSERT dbo.admin_integrations ON;
INSERT INTO dbo.admin_integrations (id, config_key, config_value, updated_at) VALUES
(1, 'jira_base_url',  'https://fpt-team.atlassian.net',  GETDATE()),
(2, 'jira_email',     'admin@fpt.edu.vn',                GETDATE()),
(3, 'jira_api_token', 'ATATT3xFfGF0_SAMPLE_TOKEN',       GETDATE()),
(4, 'github_org',     'fpt-swp391',                       GETDATE());
SET IDENTITY_INSERT dbo.admin_integrations OFF;
GO

-- =============================================
-- 11. group_integrations (mỗi nhóm có config riêng)
-- =============================================
SET IDENTITY_INSERT dbo.group_integrations ON;
INSERT INTO dbo.group_integrations (id, group_id, jira_base_url, jira_email, jira_api_token, github_token, created_at, updated_at) VALUES
(1, 1, 'https://fpt-team.atlassian.net', 'hungse182001@fpt.edu.vn', 'ATATT3x_group1_token', 'ghp_group1_sample_token_abc123', GETDATE(), GETDATE()),
(2, 2, 'https://fpt-team.atlassian.net', 'namse182006@fpt.edu.vn',  'ATATT3x_group2_token', 'ghp_group2_sample_token_def456', GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.group_integrations OFF;
GO

-- =============================================
-- 12. jira_projects (mỗi nhóm 1 Jira project)
-- =============================================
SET IDENTITY_INSERT dbo.jira_projects ON;
INSERT INTO dbo.jira_projects (id, group_id, jira_project_key, jira_project_id, jira_base_url, project_name, status, created_at, updated_at) VALUES
(1, 1, 'CLINIC', '10001', 'https://fpt-team.atlassian.net', N'Clinic Management System', 'active', GETDATE(), GETDATE()),
(2, 2, 'FSHOP',  '10002', 'https://fpt-team.atlassian.net', N'Fashion E-Commerce',       'active', GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.jira_projects OFF;
GO

-- =============================================
-- 13. jira_sprints (2 sprint mỗi nhóm)
-- =============================================
SET IDENTITY_INSERT dbo.jira_sprints ON;
INSERT INTO dbo.jira_sprints (id, group_id, jira_sprint_id, jira_board_id, name, goal, state, start_date, end_date, complete_date, created_at, updated_at) VALUES
(1, 1, 101, 1, 'CLINIC Sprint 1', N'Complete user auth and appointment booking',  'closed', '2025-01-13', '2025-02-09', '2025-02-09', GETDATE(), GETDATE()),
(2, 1, 102, 1, 'CLINIC Sprint 2', N'Patient records and doctor dashboard',        'active', '2025-02-10', '2025-03-09', NULL,         GETDATE(), GETDATE()),
(3, 2, 201, 2, 'FSHOP Sprint 1',  N'Product catalog and cart functionality',      'closed', '2025-01-13', '2025-02-09', '2025-02-09', GETDATE(), GETDATE()),
(4, 2, 202, 2, 'FSHOP Sprint 2',  N'Payment integration and order management',   'active', '2025-02-10', '2025-03-09', NULL,         GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.jira_sprints OFF;
GO

-- =============================================
-- 14. jira_issues (6 issues cho nhóm 1, 6 cho nhóm 2)
-- =============================================
SET IDENTITY_INSERT dbo.jira_issues ON;
INSERT INTO dbo.jira_issues (id, group_id, jira_issue_id, jira_issue_key, issue_type, summary, description, status, priority, parent_issue_key, epic_issue_key, assignee_user_id, assignee_display_name, reporter_user_id, reporter_display_name, jira_created_at, jira_due_date, jira_updated_at, labels, sprint_name, story_points, srs_category) VALUES
-- Nhóm 1 - Clinic
(1,  1, '10101', 'CLINIC-1', 'Epic',  'User Authentication',          'Implement login, register, forgot password',  'Done',        'High',   NULL,       NULL,        NULL, NULL,                     4, N'Trần Văn Hùng',   '2025-01-13', '2025-02-09', '2025-02-08', 'backend,auth',    'CLINIC Sprint 1', NULL, 'Functional'),
(2,  1, '10102', 'CLINIC-2', 'Story', 'Login with email/password',    'As a user I want to login with credentials',  'Done',        'High',   NULL,       'CLINIC-1',  4,    N'Trần Văn Hùng',    4, N'Trần Văn Hùng',   '2025-01-14', '2025-01-28', '2025-01-27', 'backend',         'CLINIC Sprint 1', 5.0,  'Functional'),
(3,  1, '10103', 'CLINIC-3', 'Story', 'Appointment booking form',     'Patient can book appointment with doctor',    'In Progress', 'High',   NULL,       'CLINIC-1',  5,    N'Phạm Quốc Minh',  4, N'Trần Văn Hùng',   '2025-01-15', '2025-02-15', '2025-02-10', 'frontend',        'CLINIC Sprint 2', 8.0,  'Functional'),
(4,  1, '10104', 'CLINIC-4', 'Task',  'Setup CI/CD pipeline',         'Configure GitHub Actions for auto deploy',    'Done',        'Medium', NULL,       NULL,        6,    N'Nguyễn Thị Lan',   4, N'Trần Văn Hùng',   '2025-01-13', '2025-01-20', '2025-01-19', 'devops',          'CLINIC Sprint 1', 3.0,  'Non-Functional'),
(5,  1, '10105', 'CLINIC-5', 'Bug',   'Login fails with special chars','Password with @ symbol causes 500 error',    'Done',        'High',   NULL,       'CLINIC-1',  7,    N'Lê Hoàng Đức',    5, N'Phạm Quốc Minh', '2025-01-25', '2025-01-28', '2025-01-27', 'bug,backend',     'CLINIC Sprint 1', 2.0,  'Functional'),
(6,  1, '10106', 'CLINIC-6', 'Story', 'Doctor dashboard',             'Dashboard showing appointments and patients', 'To Do',       'Medium', NULL,       NULL,        8,    N'Vũ Minh Trang',   4, N'Trần Văn Hùng',   '2025-02-10', '2025-03-01', '2025-02-10', 'frontend',        'CLINIC Sprint 2', 8.0,  'Functional'),
-- Nhóm 2 - Fashion E-Commerce
(7,  2, '20101', 'FSHOP-1',  'Epic',  'Product Catalog',              'Product listing, search, filter',             'Done',        'High',   NULL,       NULL,        NULL, NULL,                     9, N'Hoàng Văn Nam',   '2025-01-13', '2025-02-09', '2025-02-08', 'backend',         'FSHOP Sprint 1',  NULL, 'Functional'),
(8,  2, '20102', 'FSHOP-2',  'Story', 'Product listing page',         'Display products with pagination',            'Done',        'High',   NULL,       'FSHOP-1',   9,    N'Hoàng Văn Nam',    9, N'Hoàng Văn Nam',   '2025-01-14', '2025-01-28', '2025-01-26', 'frontend',        'FSHOP Sprint 1',  5.0,  'Functional'),
(9,  2, '20103', 'FSHOP-3',  'Story', 'Shopping cart',                'Add/remove items, update quantity',           'In Progress', 'High',   NULL,       'FSHOP-1',   10,   N'Đỗ Thị Hà',       9, N'Hoàng Văn Nam',   '2025-01-20', '2025-02-15', '2025-02-12', 'frontend',        'FSHOP Sprint 2',  8.0,  'Functional'),
(10, 2, '20104', 'FSHOP-4',  'Story', 'Payment with VNPay',           'Integrate VNPay payment gateway',             'To Do',       'High',   NULL,       NULL,        11,   N'Bùi Thành Long',  9, N'Hoàng Văn Nam',   '2025-02-10', '2025-03-01', '2025-02-10', 'backend,payment', 'FSHOP Sprint 2',  13.0, 'Functional'),
(11, 2, '20105', 'FSHOP-5',  'Task',  'Database schema design',       'Design ERD and create migration scripts',     'Done',        'Medium', NULL,       NULL,        12,   N'Trịnh Ngọc Thy',  9, N'Hoàng Văn Nam',   '2025-01-13', '2025-01-17', '2025-01-16', 'database',        'FSHOP Sprint 1',  3.0,  'Non-Functional'),
(12, 2, '20106', 'FSHOP-6',  'Bug',   'Product image not loading',    'Images return 404 on production server',      'Done',        'High',   NULL,       'FSHOP-1',   13,   N'Phan Đăng Khoa',  10, N'Đỗ Thị Hà',     '2025-02-01', '2025-02-05', '2025-02-04', 'bug,frontend',    'FSHOP Sprint 1',  2.0,  'Functional');
SET IDENTITY_INSERT dbo.jira_issues OFF;
GO

-- =============================================
-- 15. jira_issue_sprints (liên kết issue với sprint)
-- =============================================
SET IDENTITY_INSERT dbo.jira_issue_sprints ON;
INSERT INTO dbo.jira_issue_sprints (id, group_id, jira_issue_id, jira_sprint_id, added_at, removed_at) VALUES
-- Nhóm 1
(1, 1, '10101', 101, '2025-01-13', NULL),
(2, 1, '10102', 101, '2025-01-14', NULL),
(3, 1, '10103', 102, '2025-02-10', NULL),
(4, 1, '10104', 101, '2025-01-13', NULL),
(5, 1, '10105', 101, '2025-01-25', NULL),
(6, 1, '10106', 102, '2025-02-10', NULL),
-- Nhóm 2
(7,  2, '20101', 201, '2025-01-13', NULL),
(8,  2, '20102', 201, '2025-01-14', NULL),
(9,  2, '20103', 202, '2025-02-10', NULL),
(10, 2, '20104', 202, '2025-02-10', NULL),
(11, 2, '20105', 201, '2025-01-13', NULL),
(12, 2, '20106', 201, '2025-02-01', NULL);
SET IDENTITY_INSERT dbo.jira_issue_sprints OFF;
GO

-- =============================================
-- 16. task_comments (vài comment trên các task)
-- =============================================
SET IDENTITY_INSERT dbo.task_comments ON;
INSERT INTO dbo.task_comments (id, task_id, user_id, content, jira_comment_id, jira_author_name, created_at, updated_at) VALUES
(1, 2, 4,  N'Đã hoàn thành login API, cần review code',                    '30001', N'Trần Văn Hùng',   '2025-01-25 10:30:00', '2025-01-25 10:30:00'),
(2, 2, 5,  N'Code looks good, approved. Merge vào develop nhé',            '30002', N'Phạm Quốc Minh',  '2025-01-25 14:00:00', '2025-01-25 14:00:00'),
(3, 3, 5,  N'Đang làm UI form booking, dự kiến xong cuối tuần',           '30003', N'Phạm Quốc Minh',  '2025-02-11 09:00:00', '2025-02-11 09:00:00'),
(4, 5, 7,  N'Đã fix bug, nguyên nhân do thiếu URL encoding cho password', '30004', N'Lê Hoàng Đức',    '2025-01-27 11:00:00', '2025-01-27 11:00:00'),
(5, 8, 9,  N'Product listing đã xong, có pagination và search',            '30005', N'Hoàng Văn Nam',   '2025-01-26 16:00:00', '2025-01-26 16:00:00'),
(6, 9, 10, N'Cart UI đang làm, cần thêm API update quantity',             '30006', N'Đỗ Thị Hà',       '2025-02-12 10:00:00', '2025-02-12 10:00:00'),
(7, 12, 13, N'Fix xong rồi, do config S3 bucket sai region',              '30007', N'Phan Đăng Khoa',  '2025-02-04 15:00:00', '2025-02-04 15:00:00');
SET IDENTITY_INSERT dbo.task_comments OFF;
GO

-- =============================================
-- 17. github_repositories (mỗi nhóm 1 repo)
-- =============================================
SET IDENTITY_INSERT dbo.github_repositories ON;
INSERT INTO dbo.github_repositories (id, group_id, repo_url, repo_owner, repo_name, default_branch, visibility, is_active, created_at, updated_at) VALUES
(1, 1, 'https://github.com/fpt-swp391/clinic-management', 'fpt-swp391', 'clinic-management', 'main',    'private', 1, GETDATE(), GETDATE()),
(2, 2, 'https://github.com/fpt-swp391/fashion-ecommerce', 'fpt-swp391', 'fashion-ecommerce', 'develop', 'private', 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT dbo.github_repositories OFF;
GO

-- =============================================
-- 18. github_activities (hoạt động commit/push)
-- =============================================
SET IDENTITY_INSERT dbo.github_activities ON;
INSERT INTO dbo.github_activities (id, group_id, actor_user_id, github_username, activity_type, commit_sha, commit_message, ref_name, pushed_commit_count, occurred_at, github_event_id, repo_name, additions, deletions) VALUES
-- Nhóm 1
(1,  1, 4,  'hung-dev',  'push', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'feat: implement login API',              'refs/heads/main',        3, '2025-01-20 09:30:00', 'evt_001', 'clinic-management', 250, 10),
(2,  1, 5,  'minh-dev',  'push', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'feat: add appointment booking form',     'refs/heads/feature/book', 2, '2025-02-05 14:20:00', 'evt_002', 'clinic-management', 180, 25),
(3,  1, 6,  'lan-dev',   'push', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'ci: setup GitHub Actions pipeline',     'refs/heads/main',        1, '2025-01-18 11:00:00', 'evt_003', 'clinic-management', 85,  0),
(4,  1, 7,  'duc-dev',   'push', 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', 'fix: URL encode password in login',     'refs/heads/hotfix/login', 1, '2025-01-27 10:45:00', 'evt_004', 'clinic-management', 12,  3),
(5,  1, 8,  'trang-dev', 'push', 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', 'feat: doctor dashboard layout',         'refs/heads/feature/dash', 4, '2025-02-12 16:30:00', 'evt_005', 'clinic-management', 320, 15),
-- Nhóm 2
(6,  2, 9,  'nam-dev',   'push', 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'feat: product listing with pagination', 'refs/heads/develop',      5, '2025-01-25 10:00:00', 'evt_006', 'fashion-ecommerce', 400, 20),
(7,  2, 10, 'ha-dev',    'push', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'feat: shopping cart component',         'refs/heads/feature/cart',  3, '2025-02-08 13:15:00', 'evt_007', 'fashion-ecommerce', 210, 30),
(8,  2, 11, 'long-dev',  'push', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'feat: VNPay integration scaffold',     'refs/heads/feature/pay',   2, '2025-02-11 09:45:00', 'evt_008', 'fashion-ecommerce', 150, 5),
(9,  2, 12, 'thy-dev',   'push', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'db: create migration scripts',         'refs/heads/develop',      1, '2025-01-16 08:30:00', 'evt_009', 'fashion-ecommerce', 120, 0),
(10, 2, 13, 'khoa-dev',  'push', 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', 'fix: S3 bucket region config',         'refs/heads/hotfix/img',    1, '2025-02-04 14:30:00', 'evt_010', 'fashion-ecommerce', 8,   4);
SET IDENTITY_INSERT dbo.github_activities OFF;
GO

-- =============================================
-- 19. outbound_sync_logs (vài log đồng bộ)
-- =============================================
SET IDENTITY_INSERT dbo.outbound_sync_logs ON;
INSERT INTO dbo.outbound_sync_logs (id, target, entity_type, entity_local_id, remote_id, action, requested_by_user_id, status, error_message, created_at) VALUES
(1, 'jira',   'issue',   2,  '10102', 'create', 4,  'success', NULL,                              '2025-01-14 10:00:00'),
(2, 'jira',   'issue',   3,  '10103', 'create', 4,  'success', NULL,                              '2025-01-15 10:00:00'),
(3, 'jira',   'comment', 1,  '30001', 'create', 4,  'success', NULL,                              '2025-01-25 10:30:00'),
(4, 'github', 'repo',    1,  NULL,    'sync',   4,  'success', NULL,                              '2025-01-20 09:00:00'),
(5, 'jira',   'issue',   10, '20104', 'create', 9,  'failed',  'Jira API rate limit exceeded',    '2025-02-10 11:00:00'),
(6, 'jira',   'issue',   10, '20104', 'create', 9,  'success', NULL,                              '2025-02-10 11:05:00'),
(7, 'github', 'repo',    2,  NULL,    'sync',   9,  'success', NULL,                              '2025-01-25 09:00:00');
SET IDENTITY_INSERT dbo.outbound_sync_logs OFF;
GO

PRINT '=== Seed data inserted successfully ==='
PRINT 'Summary:'
PRINT '  - 2 semesters'
PRINT '  - 13 users (1 admin + 2 lecturers + 10 students)'
PRINT '  - 2 lecturers'
PRINT '  - 3 projects'
PRINT '  - 2 classes'
PRINT '  - 10 students'
PRINT '  - 2 groups (5 members each)'
PRINT '  - 4 grades'
PRINT '  - 4 admin integrations'
PRINT '  - 2 group integrations'
PRINT '  - 2 jira projects'
PRINT '  - 4 jira sprints'
PRINT '  - 12 jira issues'
PRINT '  - 12 jira issue-sprint links'
PRINT '  - 7 task comments'
PRINT '  - 2 github repositories'
PRINT '  - 10 github activities'
PRINT '  - 7 outbound sync logs'
GO

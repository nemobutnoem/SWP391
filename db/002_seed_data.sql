/*
  SWP391 - SQL Server Seed Data (consolidated)
  Inserts sample data for development/testing.

  Prerequisite: Run 001_schema.sql first.

  Accounts created:
    - admin1 / Admin@123  (role: Admin)
    - lec1   / Lec@123    (role: Lecturer)
    - lead1  / Lead@123   (role: TEAM_LEAD)
    - mem1   / Mem@123    (role: TEAM_MEMBER)

  Data created:
    - 1 semester (SP26)
    - 1 class (SE1701) assigned to lecturer
    - 3 topics (T01, T02, T03)
    - 4 users + 1 lecturer profile + 2 student profiles
    - 1 group (G01) with 2 members
    - 1 Jira project + 2 sample Jira issues
    - Admin integration config keys
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRAN;

    -- BCrypt hashes (cost=10)
    DECLARE @adminPassHash NVARCHAR(255) = N'$2a$10$GvDf7mNq0b7TyuwRgH5qkujrBZ/f3aU7ufb3Uob5dNfH6ioHm1CDi'; -- Admin@123
    DECLARE @lecPassHash   NVARCHAR(255) = N'$2a$10$PrUhlPe1CzDyXO3xnhMeeOSYCbgdR4zpGdiu./8dh6dBzaanMeb6W'; -- Lec@123
    DECLARE @leadPassHash  NVARCHAR(255) = N'$2a$10$J5kg1MOYseq36ZhvJNBn8eSzJDHbz5AFuUBdXe1PkIgYsx9Rg1RJq'; -- Lead@123
    DECLARE @memPassHash   NVARCHAR(255) = N'$2a$10$eemHSpHzlWbjW/ZffZVU6.9cjBLBxTYYrbaexHTQ.tyfuq2V2fGDO'; -- Mem@123

    /* =========================================================
       1) Users
       ========================================================= */
    DECLARE @adminUserId INT, @lecUserId INT, @leadUserId INT, @memUserId INT;

    -- Admin
    SELECT @adminUserId = id FROM dbo.users WHERE account = N'admin1';
    IF @adminUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, status, password_hash, created_at, updated_at)
        VALUES (N'admin1', N'Admin', N'active', @adminPassHash, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @adminUserId = SCOPE_IDENTITY();
    END

    -- Lecturer
    SELECT @lecUserId = id FROM dbo.users WHERE account = N'lec1';
    IF @lecUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, status, password_hash, created_at, updated_at)
        VALUES (N'lec1', N'Lecturer', N'active', @lecPassHash, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @lecUserId = SCOPE_IDENTITY();
    END

    -- Team Lead
    SELECT @leadUserId = id FROM dbo.users WHERE account = N'lead1';
    IF @leadUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, password_hash, created_at, updated_at)
        VALUES (N'lead1', N'TEAM_LEAD', N'lead1-gh', N'lead1-jira', N'active', @leadPassHash, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @leadUserId = SCOPE_IDENTITY();
    END

    -- Team Member
    SELECT @memUserId = id FROM dbo.users WHERE account = N'mem1';
    IF @memUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, password_hash, created_at, updated_at)
        VALUES (N'mem1', N'TEAM_MEMBER', N'mem1-gh', N'mem1-jira', N'active', @memPassHash, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @memUserId = SCOPE_IDENTITY();
    END

    /* =========================================================
       2) Lecturer profile
       ========================================================= */
    DECLARE @lecId INT;

    SELECT @lecId = id FROM dbo.lecturers WHERE user_id = @lecUserId;
    IF @lecId IS NULL
    BEGIN
        INSERT INTO dbo.lecturers(user_id, full_name, email, status, created_at)
        VALUES (@lecUserId, N'Lecturer One', N'lec1@fpt.edu.vn', N'active', SYSUTCDATETIME());
        SET @lecId = SCOPE_IDENTITY();
    END

    /* =========================================================
       3) Semester
       ========================================================= */
    DECLARE @semesterId INT;

    SELECT @semesterId = id FROM dbo.swp_semesters WHERE code = N'SP26';
    IF @semesterId IS NULL
    BEGIN
        INSERT INTO dbo.swp_semesters(code, name, start_date, end_date, status, created_at, updated_at)
        VALUES (N'SP26', N'Spring 2026', '2026-01-06', '2026-04-20', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @semesterId = SCOPE_IDENTITY();
    END

    /* =========================================================
       4) Class (assigned to lecturer + semester)
       ========================================================= */
    DECLARE @classId INT;

    SELECT @classId = id FROM dbo.classes WHERE class_code = N'SE1701';
    IF @classId IS NULL
    BEGIN
        INSERT INTO dbo.classes(class_code, class_name, major, intake_year, department, status, lecturer_id, semester_id, created_at, updated_at)
        VALUES (N'SE1701', N'Software Engineering 1701', N'SE', 2026, N'FPTU', N'active', @lecId, @semesterId, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @classId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.classes
        SET lecturer_id = COALESCE(lecturer_id, @lecId),
            semester_id = COALESCE(semester_id, @semesterId)
        WHERE id = @classId;
    END

    /* =========================================================
       5) Topics (Projects)
       ========================================================= */
    DECLARE @p1Id INT, @p2Id INT, @p3Id INT;

    SELECT @p1Id = id FROM dbo.projects WHERE semester_id = @semesterId AND project_code = N'T01';
    IF @p1Id IS NULL
    BEGIN
        INSERT INTO dbo.projects(semester_id, project_code, project_name, description, status, created_at, updated_at)
        VALUES (@semesterId, N'T01', N'Topic 01', N'Sample topic 01', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @p1Id = SCOPE_IDENTITY();
    END

    SELECT @p2Id = id FROM dbo.projects WHERE semester_id = @semesterId AND project_code = N'T02';
    IF @p2Id IS NULL
    BEGIN
        INSERT INTO dbo.projects(semester_id, project_code, project_name, description, status, created_at, updated_at)
        VALUES (@semesterId, N'T02', N'Topic 02', N'Sample topic 02', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @p2Id = SCOPE_IDENTITY();
    END

    SELECT @p3Id = id FROM dbo.projects WHERE semester_id = @semesterId AND project_code = N'T03';
    IF @p3Id IS NULL
    BEGIN
        INSERT INTO dbo.projects(semester_id, project_code, project_name, description, status, created_at, updated_at)
        VALUES (@semesterId, N'T03', N'Topic 03', N'Sample topic 03', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @p3Id = SCOPE_IDENTITY();
    END

    /* =========================================================
       6) Students
       ========================================================= */
    DECLARE @leadStudentId INT, @memStudentId INT;

    SELECT @leadStudentId = id FROM dbo.students WHERE user_id = @leadUserId;
    IF @leadStudentId IS NULL
    BEGIN
        INSERT INTO dbo.students(user_id, class_id, full_name, student_code, email, status, created_at)
        VALUES (@leadUserId, @classId, N'Leader Student', N'SE1701-001', N'lead1@fpt.edu.vn', N'active', SYSUTCDATETIME());
        SET @leadStudentId = SCOPE_IDENTITY();
    END

    SELECT @memStudentId = id FROM dbo.students WHERE user_id = @memUserId;
    IF @memStudentId IS NULL
    BEGIN
        INSERT INTO dbo.students(user_id, class_id, full_name, student_code, email, status, created_at)
        VALUES (@memUserId, @classId, N'Member Student', N'SE1701-002', N'mem1@fpt.edu.vn', N'active', SYSUTCDATETIME());
        SET @memStudentId = SCOPE_IDENTITY();
    END

    /* =========================================================
       7) Group + Members
       ========================================================= */
    DECLARE @groupId INT;

    SELECT @groupId = id FROM dbo.groups WHERE semester_id = @semesterId AND class_id = @classId AND group_code = N'G01';
    IF @groupId IS NULL
    BEGIN
        INSERT INTO dbo.groups(semester_id, class_id, project_id, group_code, group_name, description, status, leader_student_id, lecturer_id, created_at, updated_at)
        VALUES (@semesterId, @classId, @p1Id, N'G01', N'Group 01', N'Seed group', N'active', NULL, @lecId, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @groupId = SCOPE_IDENTITY();
    END

    -- Group members
    IF NOT EXISTS (SELECT 1 FROM dbo.group_members WHERE group_id = @groupId AND student_id = @leadStudentId)
        INSERT INTO dbo.group_members(group_id, student_id, role_in_group, status, joined_at, created_at, updated_at)
        VALUES (@groupId, @leadStudentId, N'LEADER', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());

    IF NOT EXISTS (SELECT 1 FROM dbo.group_members WHERE group_id = @groupId AND student_id = @memStudentId)
        INSERT INTO dbo.group_members(group_id, student_id, role_in_group, status, joined_at, created_at, updated_at)
        VALUES (@groupId, @memStudentId, N'MEMBER', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());

    -- Set leader
    UPDATE dbo.groups SET leader_student_id = @leadStudentId
    WHERE id = @groupId AND (leader_student_id IS NULL OR leader_student_id <> @leadStudentId);

    /* =========================================================
       8) Jira sample data (local cache)
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM dbo.jira_projects WHERE group_id = @groupId)
        INSERT INTO dbo.jira_projects(group_id, jira_project_key, jira_project_id, jira_base_url, project_name, status, created_at, updated_at)
        VALUES (@groupId, N'SWP391GIT', N'10001', N'https://your-domain.atlassian.net', N'Seed Jira Project', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());

    IF NOT EXISTS (SELECT 1 FROM dbo.jira_issues WHERE group_id = @groupId AND jira_issue_key = N'SWP-1')
        INSERT INTO dbo.jira_issues(
            group_id, jira_issue_id, jira_issue_key, issue_type, summary, description, status,
            priority, assignee_user_id, reporter_user_id,
            jira_created_at, jira_updated_at, last_synced_at, sync_status, created_at, updated_at
        )
        VALUES (
            @groupId, N'20001', N'SWP-1', N'Task', N'Setup repo', N'Seed issue', N'To Do',
            N'Medium', @leadUserId, @leadUserId,
            SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME(), N'SUCCESS', SYSUTCDATETIME(), SYSUTCDATETIME()
        );

    IF NOT EXISTS (SELECT 1 FROM dbo.jira_issues WHERE group_id = @groupId AND jira_issue_key = N'SWP-2')
        INSERT INTO dbo.jira_issues(
            group_id, jira_issue_id, jira_issue_key, issue_type, summary, description, status,
            priority, assignee_user_id, reporter_user_id,
            jira_created_at, jira_updated_at, last_synced_at, sync_status, created_at, updated_at
        )
        VALUES (
            @groupId, N'20002', N'SWP-2', N'Task', N'Create DB schema', N'Seed issue', N'In Progress',
            N'High', @memUserId, @leadUserId,
            SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME(), N'SUCCESS', SYSUTCDATETIME(), SYSUTCDATETIME()
        );

    /* =========================================================
       9) Admin integration config keys
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM dbo.admin_integrations WHERE config_key = 'jira_base_url')
        INSERT INTO dbo.admin_integrations(config_key) VALUES ('jira_base_url');
    IF NOT EXISTS (SELECT 1 FROM dbo.admin_integrations WHERE config_key = 'jira_email')
        INSERT INTO dbo.admin_integrations(config_key) VALUES ('jira_email');
    IF NOT EXISTS (SELECT 1 FROM dbo.admin_integrations WHERE config_key = 'jira_api_token')
        INSERT INTO dbo.admin_integrations(config_key) VALUES ('jira_api_token');
    IF NOT EXISTS (SELECT 1 FROM dbo.admin_integrations WHERE config_key = 'github_token')
        INSERT INTO dbo.admin_integrations(config_key) VALUES ('github_token');

    COMMIT;
    PRINT N'=== Seed data inserted successfully ===';
    PRINT N'Login: admin1 / Admin@123';
    PRINT N'Login: lec1   / Lec@123';
    PRINT N'Login: lead1  / Lead@123';
    PRINT N'Login: mem1   / Mem@123';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @line INT = ERROR_LINE();
    PRINT N'Seed failed at line ' + CAST(@line AS NVARCHAR(10)) + N': ' + @msg;
    THROW;
END CATCH;

/*
  SWP391 - SQL Server seed data (2026-02-23)

  Creates minimal data to run the app (Team Lead/Member):
    - 1 semester (SP26)
    - 1 class (SE1701)
    - 3 topics (projects)
    - 2 users (TEAM_LEAD / TEAM_MEMBER) with BCrypt password_hash
    - 2 students mapped to the class
    - 1 group + members + leader
    - 2 GitHub repos for the group
    - (Optional) 1 Jira project + 2 Jira issues

  Login accounts:
    - lead1 / Lead@123
    - mem1  / Mem@123

  Notes:
    - Script is idempotent-ish: it reuses rows if they already exist by unique keys.
    - Requires the patch script to have added: users.password_hash and groups.(semester_id,class_id,project_id,leader_student_id).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Required SET options when inserting/updating tables that have filtered indexes (esp. via sqlcmd)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRAN;

    DECLARE @semesterCode NVARCHAR(50) = N'SP26';
    DECLARE @classCode NVARCHAR(50) = N'SE1701';

    DECLARE @leadAccount NVARCHAR(50) = N'lead1';
    DECLARE @memAccount  NVARCHAR(50) = N'mem1';

    DECLARE @leadPassHash NVARCHAR(255) = N'$2a$10$J5kg1MOYseq36ZhvJNBn8eSzJDHbz5AFuUBdXe1PkIgYsx9Rg1RJq';
    DECLARE @memPassHash  NVARCHAR(255) = N'$2a$10$eemHSpHzlWbjW/ZffZVU6.9cjBLBxTYYrbaexHTQ.tyfuq2V2fGDO';

    /* =========================================================
       1) Semester
       ========================================================= */
    DECLARE @semesterId INT;

    SELECT @semesterId = id
    FROM dbo.swp_semesters
    WHERE code = @semesterCode;

    IF @semesterId IS NULL
    BEGIN
        INSERT INTO dbo.swp_semesters(code, name, start_date, end_date, status, created_at, updated_at)
        VALUES (@semesterCode, N'Spring 2026', '2026-01-06', '2026-04-20', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());

        SET @semesterId = SCOPE_IDENTITY();
    END

    /* =========================================================
       2) Class
       ========================================================= */
    DECLARE @classId INT;

    SELECT @classId = id
    FROM dbo.classes
    WHERE class_code = @classCode;

    IF @classId IS NULL
    BEGIN
        INSERT INTO dbo.classes(class_code, class_name, major, intake_year, department, status, lecturer_id, created_at, updated_at)
        VALUES (@classCode, N'Software Engineering 1701', N'SE', 2026, N'FPTU', N'active', NULL, SYSUTCDATETIME(), SYSUTCDATETIME());

        SET @classId = SCOPE_IDENTITY();
    END

    /* =========================================================
       3) Topics (Projects)
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
       4) Users
       ========================================================= */
    DECLARE @leadUserId INT, @memUserId INT;

    SELECT @leadUserId = id FROM dbo.users WHERE account = @leadAccount;
    IF @leadUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, created_at, updated_at, password_hash)
        VALUES (@leadAccount, N'TEAM_LEAD', N'lead1-gh', N'lead1-jira', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), @leadPassHash);
        SET @leadUserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Ensure password_hash exists for login
        UPDATE dbo.users SET password_hash = COALESCE(password_hash, @leadPassHash) WHERE id = @leadUserId;
    END

    SELECT @memUserId = id FROM dbo.users WHERE account = @memAccount;
    IF @memUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, created_at, updated_at, password_hash)
        VALUES (@memAccount, N'TEAM_MEMBER', N'mem1-gh', N'mem1-jira', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), @memPassHash);
        SET @memUserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.users SET password_hash = COALESCE(password_hash, @memPassHash) WHERE id = @memUserId;
    END

    /* =========================================================
       5) Students
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
       6) Group + members
       ========================================================= */
    DECLARE @groupId INT;

    SELECT @groupId = id
    FROM dbo.groups
    WHERE semester_id = @semesterId AND class_id = @classId AND group_code = N'G01';

    IF @groupId IS NULL
    BEGIN
        INSERT INTO dbo.groups(semester_id, class_id, project_id, group_code, group_name, description, status, leader_student_id, created_at, updated_at)
        VALUES (@semesterId, @classId, NULL, N'G01', N'Group 01', N'Seed group', N'active', NULL, SYSUTCDATETIME(), SYSUTCDATETIME());
        SET @groupId = SCOPE_IDENTITY();
    END

    -- Ensure membership rows
    IF NOT EXISTS (SELECT 1 FROM dbo.group_members WHERE group_id = @groupId AND student_id = @leadStudentId)
        INSERT INTO dbo.group_members(group_id, student_id, role_in_group, status, joined_at, created_at, updated_at)
        VALUES (@groupId, @leadStudentId, N'LEADER', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());

    IF NOT EXISTS (SELECT 1 FROM dbo.group_members WHERE group_id = @groupId AND student_id = @memStudentId)
        INSERT INTO dbo.group_members(group_id, student_id, role_in_group, status, joined_at, created_at, updated_at)
        VALUES (@groupId, @memStudentId, N'MEMBER', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());

    -- Set leader
    UPDATE dbo.groups
    SET leader_student_id = @leadStudentId
    WHERE id = @groupId AND (leader_student_id IS NULL OR leader_student_id <> @leadStudentId);

    -- Select a topic for the group
    UPDATE dbo.groups
    SET project_id = @p1Id
    WHERE id = @groupId AND project_id IS NULL;

    /* =========================================================
       7) GitHub repos
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM dbo.github_repositories WHERE group_id = @groupId AND repo_url = N'https://github.com/example-org/swp391-fe')
        INSERT INTO dbo.github_repositories(group_id, repo_url, repo_owner, repo_name, default_branch, visibility, is_active, created_at, updated_at)
        VALUES (@groupId, N'https://github.com/example-org/swp391-fe', N'example-org', N'swp391-fe', N'main', N'private', 1, SYSUTCDATETIME(), SYSUTCDATETIME());

    IF NOT EXISTS (SELECT 1 FROM dbo.github_repositories WHERE group_id = @groupId AND repo_url = N'https://github.com/example-org/swp391-be')
        INSERT INTO dbo.github_repositories(group_id, repo_url, repo_owner, repo_name, default_branch, visibility, is_active, created_at, updated_at)
        VALUES (@groupId, N'https://github.com/example-org/swp391-be', N'example-org', N'swp391-be', N'main', N'private', 1, SYSUTCDATETIME(), SYSUTCDATETIME());

    /* =========================================================
       8) Optional Jira sample data (local cache)
       ========================================================= */
    IF OBJECT_ID('dbo.jira_projects', 'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.jira_projects WHERE group_id = @groupId)
            INSERT INTO dbo.jira_projects(group_id, jira_project_key, jira_project_id, jira_base_url, project_name, status, created_at, updated_at)
            VALUES (@groupId, N'SWP', N'10001', N'https://your-domain.atlassian.net', N'Seed Jira Project', N'active', SYSUTCDATETIME(), SYSUTCDATETIME());
    END

    IF OBJECT_ID('dbo.jira_issues', 'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.jira_issues WHERE group_id = @groupId AND jira_issue_key = N'SWP-1')
            INSERT INTO dbo.jira_issues(
                group_id, jira_issue_id, jira_issue_key, issue_type, summary, description, status,
                priority, parent_issue_key, epic_issue_key, assignee_user_id, reporter_user_id,
                jira_created_at, jira_updated_at, last_synced_at, sync_status, sync_error, created_at, updated_at
            )
            VALUES (
                @groupId, N'20001', N'SWP-1', N'Task', N'Setup repo', N'Seed issue', N'To Do',
                N'Medium', NULL, NULL, @leadUserId, @leadUserId,
                SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME(), N'SUCCESS', NULL, SYSUTCDATETIME(), SYSUTCDATETIME()
            );

        IF NOT EXISTS (SELECT 1 FROM dbo.jira_issues WHERE group_id = @groupId AND jira_issue_key = N'SWP-2')
            INSERT INTO dbo.jira_issues(
                group_id, jira_issue_id, jira_issue_key, issue_type, summary, description, status,
                priority, parent_issue_key, epic_issue_key, assignee_user_id, reporter_user_id,
                jira_created_at, jira_updated_at, last_synced_at, sync_status, sync_error, created_at, updated_at
            )
            VALUES (
                @groupId, N'20002', N'SWP-2', N'Task', N'Create DB schema', N'Seed issue', N'In Progress',
                N'High', NULL, NULL, @memUserId, @leadUserId,
                SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME(), N'SUCCESS', NULL, SYSUTCDATETIME(), SYSUTCDATETIME()
            );
    END

    COMMIT;
    PRINT '✅ Seed data inserted/updated successfully.';
    PRINT 'Login: lead1 / Lead@123';
    PRINT 'Login: mem1  / Mem@123';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @line INT = ERROR_LINE();
    PRINT '❌ Seed failed at line ' + CAST(@line AS NVARCHAR(10)) + ': ' + @msg;
    THROW;
END CATCH;

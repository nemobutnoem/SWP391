/*
  SWP391 - SQL Server Schema (consolidated)
  Creates all tables from scratch for a clean database.
  Matches the live production schema exactly.

  Run order:
    1) This file  (creates tables)
    2) 002_seed_data.sql (inserts sample data)

  Target: SQL Server (dbo schema)
  All IDs: INT IDENTITY(1,1)
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

-- =====================================================
-- 1. dbo.users
-- =====================================================
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
        account          NVARCHAR(255)  NULL,
        role             VARCHAR(255)   NULL,
        github_username  NVARCHAR(255)  NULL,
        jira_account_id  NVARCHAR(255)  NULL,
        status           VARCHAR(255)   NULL,
        created_at       DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at       DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        password_hash    NVARCHAR(255)  NULL
    );

    CREATE UNIQUE INDEX UX_users_account
        ON dbo.users(account) WHERE account IS NOT NULL;

    CREATE UNIQUE INDEX uq_users_github_username
        ON dbo.users(github_username) WHERE github_username IS NOT NULL;

    CREATE UNIQUE INDEX uq_users_jira_account_id
        ON dbo.users(jira_account_id) WHERE jira_account_id IS NOT NULL;

    PRINT 'Created dbo.users';
END
GO

-- =====================================================
-- 2. dbo.lecturers
-- =====================================================
IF OBJECT_ID('dbo.lecturers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.lecturers (
        id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_lecturers PRIMARY KEY,
        user_id     INT            NOT NULL,
        full_name   NVARCHAR(255)  NULL,
        email       NVARCHAR(255)  NULL,
        status      VARCHAR(255)   NULL,
        created_at  DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        department  VARCHAR(100)   NULL,

        CONSTRAINT uq_lecturers_user_id UNIQUE (user_id),
        CONSTRAINT fk_lecturers_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );

    PRINT 'Created dbo.lecturers';
END
GO

-- =====================================================
-- 3. dbo.swp_semesters
-- =====================================================
IF OBJECT_ID('dbo.swp_semesters', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.swp_semesters (
        id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_swp_semesters PRIMARY KEY,
        code        NVARCHAR(100)  NOT NULL,
        name        NVARCHAR(255)  NULL,
        start_date  DATE           NULL,
        end_date    DATE           NULL,
        status      VARCHAR(255)   NULL,
        created_at  DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at  DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT uq_swp_semesters_code UNIQUE (code)
    );

    PRINT 'Created dbo.swp_semesters';
END
GO

-- =====================================================
-- 4. dbo.classes
-- =====================================================
IF OBJECT_ID('dbo.classes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.classes (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_classes PRIMARY KEY,
        class_code    NVARCHAR(50)   NOT NULL,
        class_name    NVARCHAR(255)  NULL,
        major         VARCHAR(255)   NULL,
        intake_year   INT            NULL,
        department    VARCHAR(255)   NULL,
        status        VARCHAR(255)   NULL,
        lecturer_id   INT            NULL,
        created_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        semester_id   INT            NULL,

        CONSTRAINT FK_classes_lecturer_id FOREIGN KEY (lecturer_id) REFERENCES dbo.lecturers(id),
        CONSTRAINT FK_classes_semester    FOREIGN KEY (semester_id) REFERENCES dbo.swp_semesters(id)
    );

    CREATE UNIQUE INDEX UX_classes_class_code
        ON dbo.classes(class_code) WHERE class_code IS NOT NULL;

    PRINT 'Created dbo.classes';
END
GO

-- =====================================================
-- 5. dbo.students
-- =====================================================
IF OBJECT_ID('dbo.students', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.students (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_students PRIMARY KEY,
        user_id       INT            NOT NULL,
        full_name     NVARCHAR(255)  NULL,
        student_code  NVARCHAR(100)  NULL,
        email         NVARCHAR(255)  NULL,
        status        VARCHAR(255)   NULL,
        created_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        class_id      INT            NULL,
        major         VARCHAR(50)    NULL,

        CONSTRAINT uq_students_user_id      UNIQUE (user_id),
        CONSTRAINT uq_students_student_code UNIQUE (student_code),
        CONSTRAINT uq_students_email        UNIQUE (email),
        CONSTRAINT fk_students_user    FOREIGN KEY (user_id)  REFERENCES dbo.users(id),
        CONSTRAINT FK_students_class_id FOREIGN KEY (class_id) REFERENCES dbo.classes(id)
    );

    CREATE INDEX IX_students_class_id ON dbo.students(class_id);

    PRINT 'Created dbo.students';
END
GO

-- =====================================================
-- 6. dbo.projects
-- =====================================================
IF OBJECT_ID('dbo.projects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.projects (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_projects PRIMARY KEY,
        semester_id   INT            NOT NULL,
        project_code  VARCHAR(255)   NULL,
        project_name  NVARCHAR(255)  NULL,
        description   VARCHAR(255)   NULL,
        status        VARCHAR(255)   NULL,
        created_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT fk_projects_semester FOREIGN KEY (semester_id) REFERENCES dbo.swp_semesters(id)
    );

    CREATE INDEX idx_projects_semester_id ON dbo.projects(semester_id);

    PRINT 'Created dbo.projects';
END
GO

-- =====================================================
-- 7. dbo.groups
-- =====================================================
IF OBJECT_ID('dbo.groups', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.groups (
        id                INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_groups PRIMARY KEY,
        semester_id       INT            NULL,
        project_id        INT            NULL,
        group_code        NVARCHAR(100)  NULL,
        group_name        NVARCHAR(255)  NULL,
        description       VARCHAR(255)   NULL,
        status            VARCHAR(255)   NULL,
        leader_student_id INT            NULL,
        created_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        class_id          INT            NULL,
        lecturer_id       INT            NULL,

        CONSTRAINT fk_groups_semester       FOREIGN KEY (semester_id)       REFERENCES dbo.swp_semesters(id),
        CONSTRAINT FK_groups_class_id       FOREIGN KEY (class_id)          REFERENCES dbo.classes(id),
        CONSTRAINT fk_groups_project        FOREIGN KEY (project_id)        REFERENCES dbo.projects(id),
        CONSTRAINT fk_groups_leader_student FOREIGN KEY (leader_student_id) REFERENCES dbo.students(id),
        CONSTRAINT FK_groups_lecturer       FOREIGN KEY (lecturer_id)       REFERENCES dbo.lecturers(id)
    );

    -- Business rule: unique group_code per class+semester
    CREATE UNIQUE INDEX UX_groups_semester_class_group_code
        ON dbo.groups(semester_id, class_id, group_code) WHERE group_code IS NOT NULL;

    -- Business rule: one topic per class
    CREATE UNIQUE INDEX UX_groups_class_project
        ON dbo.groups(class_id, project_id) WHERE project_id IS NOT NULL;

    CREATE INDEX IX_groups_class_id          ON dbo.groups(class_id);
    CREATE INDEX IX_groups_semester_id       ON dbo.groups(semester_id);
    CREATE INDEX IX_groups_project_id        ON dbo.groups(project_id);
    CREATE INDEX IX_groups_leader_student_id ON dbo.groups(leader_student_id);

    PRINT 'Created dbo.groups';
END
GO

-- =====================================================
-- 8. dbo.group_members
-- =====================================================
IF OBJECT_ID('dbo.group_members', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.group_members (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_group_members PRIMARY KEY,
        group_id      INT            NOT NULL,
        student_id    INT            NOT NULL,
        role_in_group VARCHAR(255)   NULL,
        status        VARCHAR(255)   NULL,
        joined_at     DATETIME2      NULL,
        left_at       DATETIME2      NULL,
        created_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT uq_group_members_group_student UNIQUE (group_id, student_id),
        CONSTRAINT fk_group_members_group   FOREIGN KEY (group_id)   REFERENCES dbo.groups(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_members_student FOREIGN KEY (student_id) REFERENCES dbo.students(id)
    );

    CREATE INDEX idx_group_members_student_id ON dbo.group_members(student_id);

    PRINT 'Created dbo.group_members';
END
GO

-- =====================================================
-- 9. dbo.jira_projects
-- =====================================================
IF OBJECT_ID('dbo.jira_projects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.jira_projects (
        id                INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_jira_projects PRIMARY KEY,
        group_id          INT            NOT NULL,
        jira_project_key  VARCHAR(255)   NULL,
        jira_project_id   VARCHAR(255)   NULL,
        jira_base_url     NVARCHAR(255)  NULL,
        project_name      NVARCHAR(255)  NULL,
        status            VARCHAR(255)   NULL,
        created_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT uq_jira_projects_group_id UNIQUE (group_id),
        CONSTRAINT fk_jira_projects_group FOREIGN KEY (group_id) REFERENCES dbo.groups(id) ON DELETE CASCADE
    );

    PRINT 'Created dbo.jira_projects';
END
GO

-- =====================================================
-- 10. dbo.github_repositories
-- =====================================================
IF OBJECT_ID('dbo.github_repositories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.github_repositories (
        id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_github_repositories PRIMARY KEY,
        group_id        INT            NOT NULL,
        repo_url        NVARCHAR(255)  NULL,
        repo_owner      NVARCHAR(255)  NULL,
        repo_name       NVARCHAR(255)  NULL,
        default_branch  VARCHAR(255)   NULL,
        visibility      VARCHAR(255)   NULL,
        is_active       BIT            NOT NULL DEFAULT 1,
        created_at      DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT fk_github_repositories_group FOREIGN KEY (group_id) REFERENCES dbo.groups(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_github_repositories_group_repo_url
        ON dbo.github_repositories(group_id, repo_url) WHERE repo_url IS NOT NULL;

    CREATE INDEX IX_github_repositories_group_id ON dbo.github_repositories(group_id);

    PRINT 'Created dbo.github_repositories';
END
GO

-- =====================================================
-- 11. dbo.jira_issues
-- =====================================================
IF OBJECT_ID('dbo.jira_issues', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.jira_issues (
        id                INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_jira_issues PRIMARY KEY,
        group_id          INT            NOT NULL,
        jira_issue_id     NVARCHAR(100)  NOT NULL,
        jira_issue_key    NVARCHAR(50)   NOT NULL,
        issue_type        NVARCHAR(50)   NOT NULL,
        summary           VARCHAR(255)   NULL,
        description       VARCHAR(255)   NULL,
        status            VARCHAR(255)   NULL,
        priority          NVARCHAR(50)   NULL,
        parent_issue_key  NVARCHAR(50)   NULL,
        epic_issue_key    NVARCHAR(50)   NULL,
        assignee_user_id  INT            NULL,
        reporter_user_id  INT            NULL,
        jira_created_at   DATETIME2      NULL,
        jira_updated_at   DATETIME2      NULL,
        last_synced_at    DATETIME2      NULL,
        sync_status       NVARCHAR(50)   NULL,
        sync_error        NVARCHAR(MAX)  NULL,
        created_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at        DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        jira_due_date     DATE           NULL,

        CONSTRAINT uq_jira_issues_group_issue_key UNIQUE (group_id, jira_issue_key),
        CONSTRAINT uq_jira_issues_group_issue_id  UNIQUE (group_id, jira_issue_id),
        CONSTRAINT fk_jira_issues_group    FOREIGN KEY (group_id)         REFERENCES dbo.groups(id) ON DELETE CASCADE,
        CONSTRAINT fk_jira_issues_assignee FOREIGN KEY (assignee_user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_jira_issues_reporter FOREIGN KEY (reporter_user_id) REFERENCES dbo.users(id)
    );

    CREATE INDEX idx_jira_issues_assignee_user_id ON dbo.jira_issues(assignee_user_id);
    CREATE INDEX idx_jira_issues_reporter_user_id ON dbo.jira_issues(reporter_user_id);
    CREATE INDEX idx_jira_issues_group_issue_type ON dbo.jira_issues(group_id, issue_type);
    CREATE INDEX idx_jira_issues_group_epic_key   ON dbo.jira_issues(group_id, epic_issue_key);

    PRINT 'Created dbo.jira_issues';
END
GO

-- =====================================================
-- 12. dbo.jira_sprints
-- =====================================================
IF OBJECT_ID('dbo.jira_sprints', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.jira_sprints (
        id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_jira_sprints PRIMARY KEY,
        group_id        INT            NOT NULL,
        jira_sprint_id  INT            NOT NULL,
        jira_board_id   INT            NULL,
        name            NVARCHAR(255)  NOT NULL,
        goal            NVARCHAR(MAX)  NULL,
        state           NVARCHAR(50)   NULL,
        start_date      DATETIME2      NULL,
        end_date        DATETIME2      NULL,
        complete_date   DATETIME2      NULL,
        last_synced_at  DATETIME2      NULL,
        sync_status     NVARCHAR(50)   NULL,
        sync_error      NVARCHAR(MAX)  NULL,
        created_at      DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT uq_jira_sprints_group_remote UNIQUE (group_id, jira_sprint_id),
        CONSTRAINT fk_jira_sprints_group FOREIGN KEY (group_id) REFERENCES dbo.groups(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_jira_sprints_group_state ON dbo.jira_sprints(group_id, state);

    PRINT 'Created dbo.jira_sprints';
END
GO

-- =====================================================
-- 13. dbo.jira_issue_sprints
-- =====================================================
IF OBJECT_ID('dbo.jira_issue_sprints', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.jira_issue_sprints (
        id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_jira_issue_sprints PRIMARY KEY,
        group_id        INT            NOT NULL,
        jira_issue_id   NVARCHAR(100)  NOT NULL,
        jira_sprint_id  INT            NOT NULL,
        added_at        DATETIME2      NULL,
        removed_at      DATETIME2      NULL,
        last_synced_at  DATETIME2      NULL,
        sync_status     NVARCHAR(50)   NULL,
        sync_error      NVARCHAR(MAX)  NULL,

        CONSTRAINT uq_jira_issue_sprints_triplet UNIQUE (group_id, jira_issue_id, jira_sprint_id),
        CONSTRAINT fk_jira_issue_sprints_group FOREIGN KEY (group_id) REFERENCES dbo.groups(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_jira_issue_sprints_group_issue  ON dbo.jira_issue_sprints(group_id, jira_issue_id);
    CREATE INDEX idx_jira_issue_sprints_group_sprint ON dbo.jira_issue_sprints(group_id, jira_sprint_id);

    PRINT 'Created dbo.jira_issue_sprints';
END
GO

-- =====================================================
-- 14. dbo.outbound_sync_logs
-- =====================================================
IF OBJECT_ID('dbo.outbound_sync_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.outbound_sync_logs (
        id                    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_outbound_sync_logs PRIMARY KEY,
        target                NVARCHAR(20)   NOT NULL,
        entity_type           NVARCHAR(50)   NOT NULL,
        entity_local_id       INT            NULL,
        remote_id             NVARCHAR(255)  NULL,
        action                NVARCHAR(255)  NULL,
        requested_by_user_id  INT            NULL,
        request_payload       NVARCHAR(MAX)  NULL,
        response_payload      NVARCHAR(MAX)  NULL,
        status                VARCHAR(255)   NULL,
        error_message         VARCHAR(255)   NULL,
        created_at            DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT fk_outbound_sync_logs_requested_by FOREIGN KEY (requested_by_user_id) REFERENCES dbo.users(id)
    );

    CREATE INDEX idx_outbound_sync_logs_lookup ON dbo.outbound_sync_logs(target, entity_type, entity_local_id, created_at);

    PRINT 'Created dbo.outbound_sync_logs';
END
GO

-- =====================================================
-- 15. dbo.github_activities
-- =====================================================
IF OBJECT_ID('dbo.github_activities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.github_activities (
        id                  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_github_activities PRIMARY KEY,
        group_id            INT            NOT NULL,
        actor_user_id       INT            NULL,
        github_username     NVARCHAR(255)  NULL,
        activity_type       VARCHAR(255)   NULL,
        commit_sha          VARCHAR(255)   NULL,
        commit_message      VARCHAR(255)   NULL,
        ref_name            NVARCHAR(255)  NULL,
        pushed_commit_count INT            NULL,
        occurred_at         DATETIME2      NULL,
        raw_payload         NVARCHAR(MAX)  NULL,
        github_event_id     NVARCHAR(255)  NULL,
        last_synced_at      DATETIME2      NULL,
        sync_status         NVARCHAR(50)   NULL,
        sync_error          NVARCHAR(MAX)  NULL,
        repo_name           NVARCHAR(255)  NULL,
        additions           INT            NULL,
        deletions           INT            NULL,

        CONSTRAINT uq_github_activities_group_event UNIQUE (group_id, github_event_id),
        CONSTRAINT fk_github_activities_group FOREIGN KEY (group_id)      REFERENCES dbo.groups(id) ON DELETE CASCADE,
        CONSTRAINT fk_github_activities_actor FOREIGN KEY (actor_user_id) REFERENCES dbo.users(id)
    );

    CREATE INDEX idx_github_activities_actor_user_id  ON dbo.github_activities(actor_user_id);
    CREATE INDEX idx_github_activities_group_occurred ON dbo.github_activities(group_id, occurred_at);

    PRINT 'Created dbo.github_activities';
END
GO

-- =====================================================
-- 16. dbo.reports
-- =====================================================
IF OBJECT_ID('dbo.reports', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.reports (
        id                  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_reports PRIMARY KEY,
        group_id            INT            NOT NULL,
        report_type         NVARCHAR(50)   NULL,
        period_start        DATE           NULL,
        period_end          DATE           NULL,
        title               NVARCHAR(255)  NULL,
        content             NVARCHAR(MAX)  NULL,
        status              NVARCHAR(50)   NULL,
        attempt_no          INT            NULL,
        feedback            NVARCHAR(MAX)  NULL,
        created_at          DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL DEFAULT SYSUTCDATETIME(),
        created_by_user_id  INT            NULL,
        graded_by_user_id   INT            NULL,

        CONSTRAINT fk_reports_group      FOREIGN KEY (group_id)          REFERENCES dbo.groups(id) ON DELETE CASCADE,
        CONSTRAINT fk_reports_created_by FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_reports_graded_by  FOREIGN KEY (graded_by_user_id)  REFERENCES dbo.users(id)
    );

    CREATE INDEX idx_reports_group_id   ON dbo.reports(group_id);
    CREATE INDEX idx_reports_created_by ON dbo.reports(created_by_user_id);
    CREATE INDEX idx_reports_graded_by  ON dbo.reports(graded_by_user_id);

    PRINT 'Created dbo.reports';
END
GO

-- =====================================================
-- 17. dbo.admin_integrations
-- =====================================================
IF OBJECT_ID('dbo.admin_integrations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.admin_integrations (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_admin_integrations PRIMARY KEY,
        config_key    VARCHAR(100)   NOT NULL UNIQUE,
        config_value  VARCHAR(500)   NULL,
        updated_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME()
    );

    PRINT 'Created dbo.admin_integrations';
END
GO

-- =====================================================
-- 18. dbo.group_integrations
-- =====================================================
IF OBJECT_ID('dbo.group_integrations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.group_integrations (
        id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_group_integrations PRIMARY KEY,
        group_id        INT            NOT NULL,
        jira_base_url   NVARCHAR(255)  NULL,
        jira_email      NVARCHAR(255)  NULL,
        jira_api_token  VARCHAR(255)   NULL,
        github_token    VARCHAR(255)   NULL,
        created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT UX_group_integrations_group_id UNIQUE (group_id),
        CONSTRAINT FK_group_integrations_group_id FOREIGN KEY (group_id) REFERENCES dbo.groups(id) ON DELETE CASCADE
    );

    PRINT 'Created dbo.group_integrations';
END
GO

-- =====================================================
-- 19. dbo.grades
-- =====================================================
IF OBJECT_ID('dbo.grades', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.grades (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_grades PRIMARY KEY,
        group_id      INT            NOT NULL,
        lecturer_id   INT            NOT NULL,
        milestone     NVARCHAR(200)  NULL,
        score         DECIMAL(4,2)   NULL,
        feedback      NVARCHAR(1000) NULL,
        date          DATE           NULL,
        status        VARCHAR(20)    NULL DEFAULT 'PENDING',
        created_at    DATETIME2      NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_grades_group_id    FOREIGN KEY (group_id)    REFERENCES dbo.groups(id),
        CONSTRAINT FK_grades_lecturer_id FOREIGN KEY (lecturer_id) REFERENCES dbo.lecturers(id)
    );

    PRINT 'Created dbo.grades';
END
GO

PRINT '=== Schema creation complete (19 tables) ===';

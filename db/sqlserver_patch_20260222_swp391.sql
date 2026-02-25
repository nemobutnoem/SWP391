/*
  SWP391 - SQL Server patch script (2026-02-22)
  Goal:
    - Enforce: within 1 class, 1 topic(project) can be chosen by only 1 group
    - Groups belong to exactly one class + semester (columns + FKs)
    - Allow 1 group to have multiple GitHub repos (drop unique group_id, add unique (group_id, repo_url))
    - Add local auth support: users.account unique + users.password_hash
    - Conform to DBML diagram (no supervisor/group_supervisors)

  Assumptions:
    - Your DB is SQL Server (dbo.* tables as in screenshot)
    - Existing table names: dbo.users, dbo.groups, dbo.github_repositories, dbo.projects, dbo.classes, dbo.swp_semesters, dbo.students

  IMPORTANT:
    - This script adds columns as NULL first to avoid breaking existing rows.
    - After you backfill data, you can switch columns to NOT NULL and enable CHECK on FKs.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Required SET options for creating filtered indexes reliably (especially when running via sqlcmd)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

-- Set to 1 if you want to remove supervisor-by-group mapping table.
-- WARNING: only enable if your team has agreed to drop it.
DECLARE @dropGroupSupervisors BIT = 1;

BEGIN TRY
    BEGIN TRAN;

    /* =========================================================
       1) dbo.users: password_hash + unique account
       ========================================================= */
    IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('dbo.users', 'password_hash') IS NULL
        BEGIN
            ALTER TABLE dbo.users ADD password_hash NVARCHAR(255) NULL;
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_users_account'
              AND object_id = OBJECT_ID('dbo.users')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_users_account ON dbo.users(account)
            WHERE account IS NOT NULL;
        END
    END

    /* =========================================================
       2) dbo.classes: create if missing (required by diagram)
       ========================================================= */
    IF OBJECT_ID('dbo.classes', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.classes (
            id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_classes PRIMARY KEY,
            class_code NVARCHAR(50) NOT NULL,
            class_name NVARCHAR(255) NULL,
            major NVARCHAR(50) NULL,
            intake_year INT NULL,
            department NVARCHAR(100) NULL,
            status NVARCHAR(50) NULL,
            lecturer_id INT NULL,
            created_at DATETIME2 NULL CONSTRAINT DF_classes_created_at DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2 NULL CONSTRAINT DF_classes_updated_at DEFAULT SYSUTCDATETIME()
        );

        CREATE UNIQUE INDEX UX_classes_class_code ON dbo.classes(class_code) WHERE class_code IS NOT NULL;
    END
    ELSE
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_classes_class_code'
              AND object_id = OBJECT_ID('dbo.classes')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_classes_class_code ON dbo.classes(class_code) WHERE class_code IS NOT NULL;
        END
    END

    -- Link classes -> lecturers if possible
    IF OBJECT_ID('dbo.classes', 'U') IS NOT NULL
    AND OBJECT_ID('dbo.lecturers', 'U') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_classes_lecturer_id')
    BEGIN
        ALTER TABLE dbo.classes WITH NOCHECK
        ADD CONSTRAINT FK_classes_lecturer_id
        FOREIGN KEY (lecturer_id) REFERENCES dbo.lecturers(id);
    END

    /* =========================================================
       3) dbo.students: add class_id (required by diagram)
       ========================================================= */
    IF OBJECT_ID('dbo.students', 'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('dbo.students', 'class_id') IS NULL
            ALTER TABLE dbo.students ADD class_id INT NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_students_class_id' AND object_id = OBJECT_ID('dbo.students')
        )
            CREATE INDEX IX_students_class_id ON dbo.students(class_id);

        IF OBJECT_ID('dbo.classes', 'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_students_class_id')
        BEGIN
            ALTER TABLE dbo.students WITH NOCHECK
            ADD CONSTRAINT FK_students_class_id
            FOREIGN KEY (class_id) REFERENCES dbo.classes(id);
        END
    END

    /* =========================================================
       4) dbo.groups: add semester_id/class_id/project_id/leader_student_id
          + unique constraints for business rules
       ========================================================= */
    IF OBJECT_ID('dbo.groups', 'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('dbo.groups', 'semester_id') IS NULL
            ALTER TABLE dbo.groups ADD semester_id INT NULL;

        IF COL_LENGTH('dbo.groups', 'class_id') IS NULL
            ALTER TABLE dbo.groups ADD class_id INT NULL;

        IF COL_LENGTH('dbo.groups', 'project_id') IS NULL
            ALTER TABLE dbo.groups ADD project_id INT NULL;

        IF COL_LENGTH('dbo.groups', 'leader_student_id') IS NULL
            ALTER TABLE dbo.groups ADD leader_student_id INT NULL;

        /*
          Business rule: allow reuse of group_code across different classes/semesters.
          (semester_id, class_id, group_code) must be unique when group_code is set.
        */
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_groups_semester_class_group_code'
              AND object_id = OBJECT_ID('dbo.groups')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_groups_semester_class_group_code
            ON dbo.groups(semester_id, class_id, group_code)
            WHERE group_code IS NOT NULL;
        END

        /*
          Business rule: in one class, one topic(project) can only be chosen by one group.
          Use filtered unique index so multiple NULL project_id is allowed.
        */
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_groups_class_project'
              AND object_id = OBJECT_ID('dbo.groups')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_groups_class_project
            ON dbo.groups(class_id, project_id)
            WHERE project_id IS NOT NULL;
        END

        /* Helpful non-unique indexes */
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_groups_class_id' AND object_id = OBJECT_ID('dbo.groups')
        )
            CREATE INDEX IX_groups_class_id ON dbo.groups(class_id);

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_groups_semester_id' AND object_id = OBJECT_ID('dbo.groups')
        )
            CREATE INDEX IX_groups_semester_id ON dbo.groups(semester_id);

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_groups_project_id' AND object_id = OBJECT_ID('dbo.groups')
        )
            CREATE INDEX IX_groups_project_id ON dbo.groups(project_id);

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_groups_leader_student_id' AND object_id = OBJECT_ID('dbo.groups')
        )
            CREATE INDEX IX_groups_leader_student_id ON dbo.groups(leader_student_id);
    END

     /* =========================================================
         5) dbo.github_repositories: allow multiple repos per group
          - drop unique index/constraint on group_id (if exists)
          - add unique (group_id, repo_url)
       ========================================================= */
    IF OBJECT_ID('dbo.github_repositories', 'U') IS NOT NULL
    BEGIN
        /* Drop UNIQUE constraints on (group_id) only */
        DECLARE @dropSql NVARCHAR(MAX) = N'';

        SELECT @dropSql = @dropSql + N'
            ALTER TABLE dbo.github_repositories DROP CONSTRAINT ' + QUOTENAME(kc.name) + N';'
        FROM sys.key_constraints kc
        JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE kc.parent_object_id = OBJECT_ID('dbo.github_repositories')
          AND kc.[type] = 'UQ'
        GROUP BY kc.name
        HAVING COUNT(*) = 1 AND MAX(c.name) = 'group_id';

        /* Drop UNIQUE indexes on (group_id) only */
        SELECT @dropSql = @dropSql + N'
            DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.github_repositories;'
        FROM sys.indexes i
        JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('dbo.github_repositories')
          AND i.is_unique = 1
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0
        GROUP BY i.name
        HAVING COUNT(*) = 1 AND MAX(c.name) = 'group_id';

        IF (@dropSql <> N'')
            EXEC sp_executesql @dropSql;

        /* Add unique constraint per repo url within a group */
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_github_repositories_group_repo_url'
              AND object_id = OBJECT_ID('dbo.github_repositories')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_github_repositories_group_repo_url
            ON dbo.github_repositories(group_id, repo_url)
            WHERE repo_url IS NOT NULL;
        END

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_github_repositories_group_id' AND object_id = OBJECT_ID('dbo.github_repositories')
        )
            CREATE INDEX IX_github_repositories_group_id ON dbo.github_repositories(group_id);
    END

    /* =========================================================
       5b) dbo.group_integrations: per-group Jira/GitHub settings
          - store tokens per group so teams can self-manage integrations
       ========================================================= */
    IF OBJECT_ID('dbo.group_integrations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.group_integrations (
            id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_group_integrations PRIMARY KEY,
            group_id INT NOT NULL,
            jira_base_url NVARCHAR(255) NULL,
            jira_email NVARCHAR(255) NULL,
            jira_api_token NVARCHAR(4000) NULL,
            github_token NVARCHAR(4000) NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_group_integrations_created_at DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2 NOT NULL CONSTRAINT DF_group_integrations_updated_at DEFAULT SYSUTCDATETIME()
        );

        CREATE UNIQUE INDEX UX_group_integrations_group_id ON dbo.group_integrations(group_id);
    END
    ELSE
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'UX_group_integrations_group_id'
              AND object_id = OBJECT_ID('dbo.group_integrations')
        )
        BEGIN
            CREATE UNIQUE INDEX UX_group_integrations_group_id ON dbo.group_integrations(group_id);
        END
    END

    IF OBJECT_ID('dbo.groups', 'U') IS NOT NULL
    AND OBJECT_ID('dbo.group_integrations', 'U') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_group_integrations_group_id')
    BEGIN
        ALTER TABLE dbo.group_integrations WITH NOCHECK
        ADD CONSTRAINT FK_group_integrations_group_id
        FOREIGN KEY (group_id) REFERENCES dbo.groups(id)
        ON DELETE CASCADE;
    END

    IF OBJECT_ID('dbo.TR_group_integrations_updated_at', 'TR') IS NULL
    AND OBJECT_ID('dbo.group_integrations', 'U') IS NOT NULL
    BEGIN
        EXEC('CREATE TRIGGER dbo.TR_group_integrations_updated_at
              ON dbo.group_integrations
              AFTER UPDATE
              AS
              BEGIN
                  SET NOCOUNT ON;
                  UPDATE gi
                  SET updated_at = SYSUTCDATETIME()
                  FROM dbo.group_integrations gi
                  INNER JOIN inserted i ON i.id = gi.id;
              END');
    END

     /* =========================================================
         6) Add/ensure foreign keys (created WITH NOCHECK to avoid failing
          on existing dirty data; you can validate later)
       ========================================================= */
    IF OBJECT_ID('dbo.groups', 'U') IS NOT NULL
    BEGIN
        IF OBJECT_ID('dbo.swp_semesters', 'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_groups_semester_id')
        BEGIN
            ALTER TABLE dbo.groups WITH NOCHECK
            ADD CONSTRAINT FK_groups_semester_id
            FOREIGN KEY (semester_id) REFERENCES dbo.swp_semesters(id);
        END

        IF OBJECT_ID('dbo.classes', 'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_groups_class_id')
        BEGIN
            ALTER TABLE dbo.groups WITH NOCHECK
            ADD CONSTRAINT FK_groups_class_id
            FOREIGN KEY (class_id) REFERENCES dbo.classes(id);
        END

        IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_groups_project_id')
        BEGIN
            ALTER TABLE dbo.groups WITH NOCHECK
            ADD CONSTRAINT FK_groups_project_id
            FOREIGN KEY (project_id) REFERENCES dbo.projects(id);
        END

        IF OBJECT_ID('dbo.students', 'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_groups_leader_student_id')
        BEGIN
            ALTER TABLE dbo.groups WITH NOCHECK
            ADD CONSTRAINT FK_groups_leader_student_id
            FOREIGN KEY (leader_student_id) REFERENCES dbo.students(id);
        END
    END

     /* =========================================================
         7) Remove supervisor table (NOT in DBML)
       ========================================================= */
    IF @dropGroupSupervisors = 1 AND OBJECT_ID('dbo.group_supervisors', 'U') IS NOT NULL
    BEGIN
        DECLARE @dropFkSql NVARCHAR(MAX) = N'';

        -- Drop any foreign keys that reference dbo.group_supervisors (safety)
        SELECT @dropFkSql = @dropFkSql + N'
            ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(pt.schema_id)) + N'.' + QUOTENAME(pt.name) +
            N' DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';'
        FROM sys.foreign_keys fk
        JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
        WHERE fk.referenced_object_id = OBJECT_ID('dbo.group_supervisors');

        IF (@dropFkSql <> N'')
            EXEC sp_executesql @dropFkSql;

        DROP TABLE dbo.group_supervisors;
    END

    COMMIT;
    PRINT '✅ Patch applied successfully.';

    /* =========================================================
       Post steps (manual):
       1) Backfill dbo.groups.semester_id / class_id for existing rows
       2) Backfill dbo.groups.project_id if already assigned
       3) After data is clean, validate FKs:
          ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_semester_id;
          ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_class_id;
          ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_project_id;
          ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_leader_student_id;
       4) Optionally make columns NOT NULL after backfill.
       ========================================================= */

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @line INT = ERROR_LINE();
    PRINT '❌ Patch failed at line ' + CAST(@line AS NVARCHAR(10)) + ': ' + @msg;
    THROW;
END CATCH;

/*
=============================================================
OPTIONAL (run later): enforce NOT NULL after backfill
=============================================================

-- Example (only run when ALL rows have values):
-- ALTER TABLE dbo.groups ALTER COLUMN semester_id INT NOT NULL;
-- ALTER TABLE dbo.groups ALTER COLUMN class_id INT NOT NULL;

-- Re-validate foreign keys (after cleaning data):
-- ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_semester_id;
-- ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_class_id;
-- ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_project_id;
-- ALTER TABLE dbo.groups WITH CHECK CHECK CONSTRAINT FK_groups_leader_student_id;
*/

/*
  SWP391 - SQL Server patch (2026-03-06)
  Fix: Allow multiple NULL values in jira_account_id and github_username columns.

  Problem:
    SQL Server unique indexes treat NULL as a value, so only ONE row can have
    NULL jira_account_id / NULL github_username.  This breaks Google-auth signup
    because new users are created without Jira/GitHub info.

  Solution:
    Replace unfiltered unique indexes with filtered unique indexes
    (WHERE column IS NOT NULL) so uniqueness is only enforced for actual values.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY
    BEGIN TRAN;

    /* ---- jira_account_id ---- */

    -- Drop the constraint/index whatever its name is
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_users_jira_account_id' AND object_id = OBJECT_ID('dbo.users'))
        DROP INDEX uq_users_jira_account_id ON dbo.users;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uk_user_jira_account_id' AND object_id = OBJECT_ID('dbo.users'))
        DROP INDEX uk_user_jira_account_id ON dbo.users;

    -- Recreate as filtered unique index (allows multiple NULLs)
    CREATE UNIQUE INDEX uq_users_jira_account_id
        ON dbo.users(jira_account_id)
        WHERE jira_account_id IS NOT NULL;

    /* ---- github_username ---- */

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_users_github_username' AND object_id = OBJECT_ID('dbo.users'))
        DROP INDEX uq_users_github_username ON dbo.users;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uk_user_github_username' AND object_id = OBJECT_ID('dbo.users'))
        DROP INDEX uk_user_github_username ON dbo.users;

    -- Recreate as filtered unique index (allows multiple NULLs)
    CREATE UNIQUE INDEX uq_users_github_username
        ON dbo.users(github_username)
        WHERE github_username IS NOT NULL;

    COMMIT TRAN;
    PRINT 'Patch applied successfully: nullable unique indexes on users table are now filtered.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Patch failed: %s', 16, 1, @msg);
END CATCH;

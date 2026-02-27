/*
  Add Jira due date column to local Jira issues cache.
  - Jira field: fields.duedate (date only, ISO yyyy-MM-dd)
  - Local column: dbo.jira_issues.jira_due_date (DATE)

  Safe to run multiple times.
*/

BEGIN TRY
    IF OBJECT_ID('dbo.jira_issues', 'U') IS NULL
    BEGIN
        PRINT '⚠️ Table dbo.jira_issues does not exist. Nothing to patch.';
        RETURN;
    END

    IF COL_LENGTH('dbo.jira_issues', 'jira_due_date') IS NULL
    BEGIN
        ALTER TABLE dbo.jira_issues
        ADD jira_due_date DATE NULL;

        PRINT '✅ Added column dbo.jira_issues.jira_due_date (DATE NULL)';
    END
    ELSE
    BEGIN
        PRINT 'ℹ️ Column dbo.jira_issues.jira_due_date already exists. Skipping.';
    END

END TRY
BEGIN CATCH
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @line INT = ERROR_LINE();
    PRINT '❌ Patch failed at line ' + CAST(@line AS NVARCHAR(10)) + ': ' + @msg;
    THROW;
END CATCH;
